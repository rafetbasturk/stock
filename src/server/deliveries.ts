// src/server/deliveries.ts
import { createServerFn } from '@tanstack/react-start'
import {
  and,
  desc as drizzleDesc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  SQL,
  sql,
} from 'drizzle-orm'
import z from 'zod'
import {
  addDeliveryTotals,
  addTotalAmount,
  normalizeDateForDB,
  normalizeParams,
  notDeleted,
  updateOrderStatusIfComplete,
} from './utils'
import { requireAuth } from './auth/requireAuth'
import { db } from '@/db'
import {
  customOrderItemsTable,
  customersTable,
  deliveriesTable,
  deliveryItemsTable,
  orderItemsTable,
} from '@/db/schema'
import { fail, failValidation } from '@/lib/error/core/serverError'
import { BaseAppError } from '@/lib/error/core'
import {
  createStockMovementTx,
  internalStockMovementCleanupTx,
} from './services/stockService'
import { deliveriesSearchSchema } from '@/lib/types/types.search'

type DeliveryKind = 'DELIVERY' | 'RETURN'

export interface CreateDeliveryInput {
  customer_id: number
  delivery_number: string
  delivery_date: Date | string
  kind?: DeliveryKind
  notes?: string
  items: (
    | { order_item_id: number; delivered_quantity: number }
    | { custom_order_item_id: number; delivered_quantity: number }
  )[]
}

function resolveDeliveryStockMovement(kind: DeliveryKind, quantity: number) {
  return {
    quantity: kind === 'RETURN' ? quantity : -quantity,
    movementType: kind === 'RETURN' ? 'IN' : 'OUT',
    notePrefix: kind === 'RETURN' ? 'Return' : 'Delivery',
  } as const
}

function normalizeDeliveryItemsForComparison(
  items: Array<{
    delivered_quantity: number
    order_item_id?: number | null
    custom_order_item_id?: number | null
  }>,
) {
  return items
    .map((item) => {
      if (item.order_item_id != null) {
        return `order:${item.order_item_id}:${item.delivered_quantity}`
      }
      if (item.custom_order_item_id != null) {
        return `custom:${item.custom_order_item_id}:${item.delivered_quantity}`
      }
      return null
    })
    .filter((item): item is string => item != null)
    .sort()
}

async function assertReturnQuantitiesWithinDeliveredTx(
  tx: any,
  items: CreateDeliveryInput['items'],
  excludeDeliveryId?: number,
) {
  const standardRequested = new Map<number, number>()
  const customRequested = new Map<number, number>()

  for (const item of items) {
    if ('order_item_id' in item) {
      standardRequested.set(
        item.order_item_id,
        (standardRequested.get(item.order_item_id) ?? 0) +
          item.delivered_quantity,
      )
    } else if ('custom_order_item_id' in item) {
      customRequested.set(
        item.custom_order_item_id,
        (customRequested.get(item.custom_order_item_id) ?? 0) +
          item.delivered_quantity,
      )
    }
  }

  const returnSignExpr = sql<number>`
    cast(
      coalesce(
        sum(
          case
            when ${deliveriesTable.kind} = 'RETURN' then -${deliveryItemsTable.delivered_quantity}
            else ${deliveryItemsTable.delivered_quantity}
          end
        ),
        0
      ) as int
    )
  `

  if (standardRequested.size > 0) {
    const conditions: SQL[] = [
      inArray(deliveryItemsTable.order_item_id, [...standardRequested.keys()]),
      isNull(deliveryItemsTable.deleted_at),
      isNull(deliveriesTable.deleted_at),
    ]

    if (excludeDeliveryId) {
      conditions.push(ne(deliveriesTable.id, excludeDeliveryId))
    }

    const rows = await tx
      .select({
        order_item_id: deliveryItemsTable.order_item_id,
        net_delivered: returnSignExpr,
      })
      .from(deliveryItemsTable)
      .innerJoin(
        deliveriesTable,
        eq(deliveryItemsTable.delivery_id, deliveriesTable.id),
      )
      .where(and(...conditions))
      .groupBy(deliveryItemsTable.order_item_id)

    const netByItem = new Map<number, number>()
    for (const row of rows) {
      if (row.order_item_id == null) continue
      netByItem.set(row.order_item_id, Number(row.net_delivered ?? 0))
    }

    for (const [itemId, requested] of standardRequested) {
      const delivered = netByItem.get(itemId) ?? 0
      if (requested > delivered) {
        fail('RETURN_QUANTITY_EXCEEDS_DELIVERED')
      }
    }
  }

  if (customRequested.size > 0) {
    const conditions: SQL[] = [
      inArray(deliveryItemsTable.custom_order_item_id, [
        ...customRequested.keys(),
      ]),
      isNull(deliveryItemsTable.deleted_at),
      isNull(deliveriesTable.deleted_at),
    ]

    if (excludeDeliveryId) {
      conditions.push(ne(deliveriesTable.id, excludeDeliveryId))
    }

    const rows = await tx
      .select({
        custom_order_item_id: deliveryItemsTable.custom_order_item_id,
        net_delivered: returnSignExpr,
      })
      .from(deliveryItemsTable)
      .innerJoin(
        deliveriesTable,
        eq(deliveryItemsTable.delivery_id, deliveriesTable.id),
      )
      .where(and(...conditions))
      .groupBy(deliveryItemsTable.custom_order_item_id)

    const netByItem = new Map<number, number>()
    for (const row of rows) {
      if (row.custom_order_item_id == null) continue
      netByItem.set(row.custom_order_item_id, Number(row.net_delivered ?? 0))
    }

    for (const [itemId, requested] of customRequested) {
      const delivered = netByItem.get(itemId) ?? 0
      if (requested > delivered) {
        fail('RETURN_QUANTITY_EXCEEDS_DELIVERED')
      }
    }
  }
}

export const createDelivery = createServerFn()
  .inputValidator((data: CreateDeliveryInput) => data)
  .handler(async ({ data }) => {
    const user = await requireAuth()

    const { customer_id, delivery_number, delivery_date, notes, items } = data
    const kind: DeliveryKind = data.kind === 'RETURN' ? 'RETURN' : 'DELIVERY'

    const fieldErrors: Record<
      string,
      { i18n: { ns: 'validation'; key: 'required' } }
    > = {}

    if (!customer_id) {
      fieldErrors.customer_id = { i18n: { ns: 'validation', key: 'required' } }
    }

    if (!delivery_number?.trim()) {
      fieldErrors.delivery_number = {
        i18n: { ns: 'validation', key: 'required' },
      }
    }

    if (!items?.length) {
      fieldErrors.items = { i18n: { ns: 'validation', key: 'required' } }
    }

    if (Object.keys(fieldErrors).length > 0) {
      failValidation(fieldErrors)
    }

    try {
      const result = await db.transaction(async (tx) => {
        /*───────────────────────────────────────────────
          1️⃣ VALIDATE STOCK
        ───────────────────────────────────────────────*/
        const standardItems = items.filter(
          (i): i is { order_item_id: number; delivered_quantity: number } =>
            'order_item_id' in i && i.order_item_id != null,
        )

        const affectedOrderIds = new Set<number>()

        let standardOrderItems: {
          id: number
          order_id: number | null
          product_id: number | null
          product: {
            id: number
            stock_quantity: number
            code: string | null
            name: string | null
          } | null
        }[] = []

        if (standardItems.length > 0) {
          const ids = standardItems.map((i) => i.order_item_id)

          if (new Set(ids).size !== ids.length) fail('DUPLICATE_ORDER_ITEM')

          standardOrderItems = await tx.query.orderItemsTable.findMany({
            where: and(
              inArray(orderItemsTable.id, ids),
              isNull(orderItemsTable.deleted_at),
            ),
            columns: {
              id: true,
              order_id: true,
              product_id: true,
            },
            with: {
              product: {
                columns: {
                  id: true,
                  stock_quantity: true,
                  code: true,
                  name: true,
                },
              },
            },
          })

          if (standardOrderItems.length !== standardItems.length)
            fail('ORDER_ITEM_NOT_FOUND')

          for (const item of standardItems) {
            if (item.delivered_quantity <= 0) fail('INVALID_DELIVERY_QUANTITY')

            const orderItem = standardOrderItems.find(
              (oi) => oi.id === item.order_item_id,
            )

            if (!orderItem?.product) fail('ORDER_ITEM_MISSING_PRODUCT')

            if (orderItem.order_id) affectedOrderIds.add(orderItem.order_id)
          }
        }

        const customItems = items.filter(
          (
            i,
          ): i is {
            custom_order_item_id: number
            delivered_quantity: number
          } => 'custom_order_item_id' in i && i.custom_order_item_id != null,
        )

        if (customItems.length > 0) {
          const customRows = await tx.query.customOrderItemsTable.findMany({
            where: and(
              inArray(
                customOrderItemsTable.id,
                customItems.map((item) => item.custom_order_item_id),
              ),
              isNull(customOrderItemsTable.deleted_at),
            ),
            columns: {
              id: true,
              order_id: true,
            },
          })

          for (const item of customRows) {
            if (item.order_id) affectedOrderIds.add(item.order_id)
          }
        }

        if (kind === 'RETURN') {
          await assertReturnQuantitiesWithinDeliveredTx(tx, items)
        }

        /*───────────────────────────────────────────────
          2️⃣ INSERT DELIVERY HEADER
        ───────────────────────────────────────────────*/
        const [delivery] = await tx
          .insert(deliveriesTable)
          .values({
            customer_id,
            kind,
            delivery_number,
            delivery_date: normalizeDateForDB(delivery_date),
            notes,
          })
          .returning()

        if (!delivery) {
          fail('DELIVERY_CREATION_FAILED')
        }

        /*───────────────────────────────────────────────
          3️⃣ INSERT DELIVERY ITEMS
        ───────────────────────────────────────────────*/
        await tx.insert(deliveryItemsTable).values(
          items.map((item) => ({
            delivery_id: delivery.id,
            order_item_id: 'order_item_id' in item ? item.order_item_id : null,
            custom_order_item_id:
              'custom_order_item_id' in item ? item.custom_order_item_id : null,
            delivered_quantity: item.delivered_quantity,
          })),
        )

        /*───────────────────────────────────────────────
          4️⃣ DEDUCT STOCK
        ───────────────────────────────────────────────*/
        if (standardItems.length > 0) {
          const orderItemMap = new Map(
            standardOrderItems.map((oi) => [oi.id, oi]),
          )

          for (const item of standardItems) {
            const orderItem = orderItemMap.get(item.order_item_id)

            if (!orderItem) fail('ORDER_ITEM_NOT_FOUND')

            if (!orderItem.product_id) fail('ORDER_ITEM_INVALID')

            const stockMovement = resolveDeliveryStockMovement(
              kind,
              item.delivered_quantity,
            )

            await createStockMovementTx(tx, {
              product_id: orderItem.product_id,
              quantity: stockMovement.quantity,
              movement_type: stockMovement.movementType,

              reference_type: 'delivery',

              reference_id: delivery.id,

              created_by: user.id,

              notes: `${stockMovement.notePrefix} #${delivery.delivery_number}`,
            })
          }
        }

        /*───────────────────────────────────────────────
          5️⃣ UPDATE ORDER STATUS
        ───────────────────────────────────────────────*/
        for (const orderId of affectedOrderIds) {
          await updateOrderStatusIfComplete(tx, orderId)
        }

        /*───────────────────────────────────────────────
          6️⃣ RETURN CREATED DELIVERY
        ───────────────────────────────────────────────*/
        const created = await tx.query.deliveriesTable.findFirst({
          where: eq(deliveriesTable.id, delivery.id),
          with: {
            customer: true,
            items: {
              with: {
                orderItem: {
                  with: {
                    product: true,
                  },
                },
                customOrderItem: true,
              },
            },
          },
        })

        return created
      })

      return result
    } catch (error) {
      console.error('[createDelivery] failed:', error)

      if (error instanceof BaseAppError) {
        throw error
      }

      fail('DELIVERY_CREATION_FAILED')
    }
  })

export const getDeliveries = createServerFn().handler(async () => {
  const deliveriesRaw = await db.query.deliveriesTable.findMany({
    with: {
      customer: true,
      items: {
        with: {
          orderItem: {
            with: {
              product: true,
              order: true,
              deliveries: {
                columns: {
                  id: true,
                  delivered_quantity: true,
                },
                with: {
                  delivery: {
                    columns: {
                      delivery_number: true,
                      delivery_date: true,
                      kind: true,
                    },
                  },
                },
              },
            },
          },
          customOrderItem: {
            with: {
              order: true,
              deliveries: {
                columns: {
                  id: true,
                  delivered_quantity: true,
                },
                with: {
                  delivery: {
                    columns: {
                      delivery_number: true,
                      delivery_date: true,
                      kind: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: (d, { desc }) => [desc(d.delivery_number), desc(d.delivery_date)],
  })

  return deliveriesRaw.map(addTotalAmount)
})

export const getDeliveryById = createServerFn()
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const delivery = await db.query.deliveriesTable.findFirst({
      with: {
        customer: true,
        items: {
          with: {
            orderItem: {
              with: {
                product: true,
                order: true,
                deliveries: {
                  columns: {
                    delivered_quantity: true,
                    id: true,
                  },
                  with: {
                    delivery: {
                      columns: {
                        delivery_number: true,
                        delivery_date: true,
                        kind: true,
                      },
                    },
                  },
                },
              },
            },
            customOrderItem: {
              with: {
                order: true,
              },
            },
          },
        },
      },
      where: (d, { eq: eqFn }) => eqFn(d.id, data.id),
    })

    return delivery ? addTotalAmount(delivery) : null
  })

export const getPaginatedDeliveries = createServerFn()
  .inputValidator((data) => deliveriesSearchSchema.parse(data))
  .handler(async ({ data }) => {
    const {
      pageIndex,
      pageSize,
      startDate: startDateRaw,
      endDate: endDateRaw,
      q,
      customerId,
      sortBy,
      sortDir,
      kind,
    } = data

    const safePageIndex = Math.max(0, pageIndex)
    const safePageSize = Math.min(Math.max(10, pageSize), 100)

    const normalizedQ = normalizeParams(q)
    const normalizedCustomerId = normalizeParams(customerId)
    const normalizedKind = normalizeParams(kind)

    const conditions: SQL[] = [notDeleted(deliveriesTable)]

    // Search condition
    if (normalizedQ) {
      const search = `%${normalizedQ}%`

      conditions.push(
        or(
          ilike(deliveriesTable.delivery_number, search),
          ilike(deliveriesTable.notes, search),
        )!,
      )
    }

    if (startDateRaw) {
      conditions.push(
        sql`${deliveriesTable.delivery_date} >= (${startDateRaw}::date AT TIME ZONE 'Europe/Istanbul')`,
      )
    }

    if (endDateRaw) {
      conditions.push(
        sql`${deliveriesTable.delivery_date} < ((${endDateRaw}::date + INTERVAL '1 day') AT TIME ZONE 'Europe/Istanbul')`,
      )
    }

    if (normalizedCustomerId) {
      const ids = normalizedCustomerId
        .split('|')
        .map(Number)
        .filter((n) => Number.isInteger(n))

      if (ids.length > 1) {
        conditions.push(inArray(deliveriesTable.customer_id, ids))
      } else if (ids.length === 1) {
        conditions.push(eq(deliveriesTable.customer_id, ids[0]))
      }
    }

    if (normalizedKind) {
      const values = normalizedKind.split(',').filter(Boolean)

      if (values.length > 1)
        conditions.push(inArray(deliveriesTable.kind, values as any))
      else conditions.push(eq(deliveriesTable.kind, values[0] as any))
    }

    const whereExpr: SQL =
      conditions.length === 1 ? conditions[0] : and(...conditions)!

    const rankingExpr = normalizedQ
      ? sql<number>`
        (
          CASE
            WHEN ${deliveriesTable.delivery_number} = ${normalizedQ}
            THEN 1000
            ELSE 0
          END
          +
          similarity(${deliveriesTable.delivery_number}, ${q}) * 100
          +
          similarity(${deliveriesTable.notes}, ${q}) * 10
        )
      `
      : undefined

    const [totalResult, deliveries] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(deliveriesTable)
        .where(whereExpr),
      db.query.deliveriesTable.findMany({
        with: {
          customer: true,
          items: {
            with: {
              orderItem: {
                with: {
                  product: true,
                  order: true,
                  deliveries: {
                    columns: {
                      id: true,
                      delivered_quantity: true,
                    },
                    with: {
                      delivery: {
                        columns: {
                          delivery_number: true,
                          delivery_date: true,
                          kind: true,
                        },
                      },
                    },
                  },
                },
              },
              customOrderItem: {
                with: {
                  order: true,
                  deliveries: {
                    columns: {
                      id: true,
                      delivered_quantity: true,
                    },
                    with: {
                      delivery: {
                        columns: {
                          delivery_number: true,
                          delivery_date: true,
                          kind: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        where: () => whereExpr,
        limit: safePageSize,
        offset: safePageIndex * safePageSize,
        orderBy: (d, { asc, desc }) => {
          if (q && rankingExpr)
            return [desc(rankingExpr), desc(d.delivery_date), asc(d.id)]

          const dir = sortDir === 'asc' ? asc : desc

          const customerNameExpr = sql<string>`(
            SELECT "customers"."name"
            FROM "customers"
            WHERE "customers"."id" = ${d.customer_id}
          )`

          switch (sortBy) {
            case 'delivery_number':
              return [dir(d.delivery_number), desc(d.delivery_date), asc(d.id)]

            case 'delivery_date':
              return [dir(d.delivery_date), desc(d.delivery_number), asc(d.id)]

            case 'kind':
              return [dir(d.kind), desc(d.delivery_date), asc(d.id)]

            case 'customer':
              return [dir(customerNameExpr), desc(d.delivery_date), asc(d.id)]

            default:
              return [desc(d.delivery_date), asc(d.id)]
          }
        },
      }),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: deliveries.map(addDeliveryTotals),
      pageIndex: safePageIndex,
      pageSize: safePageSize,
      total,
      pageCount: Math.ceil(total / safePageSize),
    }
  })

export const removeDelivery = createServerFn()
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data: { id } }) => {
    try {
      const user = await requireAuth()
      await db.transaction(async (tx) => {
        // 1. Get delivery items to identify affected orders
        const items = await tx.query.deliveryItemsTable.findMany({
          where: eq(deliveryItemsTable.delivery_id, id),
          with: {
            orderItem: true,
            customOrderItem: true,
          },
        })

        const affectedOrderIds = new Set<number>()
        for (const item of items) {
          if (item.orderItem?.order_id)
            affectedOrderIds.add(item.orderItem.order_id)
          if (item.customOrderItem?.order_id)
            affectedOrderIds.add(item.customOrderItem.order_id)
        }

        // 2. Cleanup stock movements (REVERSAL AUDIT) and revert product stock
        await internalStockMovementCleanupTx(tx, 'delivery', id, user.id)

        // 3. Soft delete delivery header and items
        await tx
          .update(deliveriesTable)
          .set({
            deleted_at: sql`now()`,
            updated_at: sql`now()`,
          })
          .where(eq(deliveriesTable.id, id))

        await tx
          .update(deliveryItemsTable)
          .set({
            deleted_at: sql`now()`,
            updated_at: sql`now()`,
          })
          .where(eq(deliveryItemsTable.delivery_id, id))

        // 4. Update order statuses
        for (const orderId of affectedOrderIds) {
          await updateOrderStatusIfComplete(tx, orderId)
        }
      })

      return { success: true }
    } catch (error) {
      console.error('[removeDelivery] failed:', error)
      if (error instanceof BaseAppError) throw error
      fail('DELIVERY_REMOVAL_FAILED')
    }
  })

export const getLastDeliveryNumber = createServerFn().handler(async () => {
  const [lastDelivery] = await db
    .select({
      delivery_number: deliveriesTable.delivery_number,
    })
    .from(deliveriesTable)
    .where(
      and(notDeleted(deliveriesTable), eq(deliveriesTable.kind, 'DELIVERY')),
    )
    .orderBy(
      drizzleDesc(deliveriesTable.created_at),
      drizzleDesc(deliveriesTable.id),
    )
    .limit(1)

  return lastDelivery?.delivery_number
})

export const getLastReturnDeliveryNumber = createServerFn().handler(
  async () => {
    const [lastReturn] = await db
      .select({
        delivery_number: deliveriesTable.delivery_number,
      })
      .from(deliveriesTable)
      .where(
        and(notDeleted(deliveriesTable), eq(deliveriesTable.kind, 'RETURN')),
      )
      .orderBy(
        drizzleDesc(deliveriesTable.created_at),
        drizzleDesc(deliveriesTable.id),
      )
      .limit(1)

    return lastReturn?.delivery_number
  },
)

export const getDeliveryFilterOptions = createServerFn().handler(async () => {
  const customerRows = await db
    .selectDistinct({
      customer_id: deliveriesTable.customer_id,
      customer_name: customersTable.name,
    })
    .from(deliveriesTable)
    .where(notDeleted(customersTable))
    .innerJoin(
      customersTable,
      eq(customersTable.id, deliveriesTable.customer_id),
    )

  const customers = customerRows
    .map((row) => ({
      id: row.customer_id,
      name: row.customer_name.trim(),
    }))
    .filter((row) => row.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }))

  return {
    customers,
  }
})

const updateDeliveryItemSchema = z.union([
  z.object({
    id: z.number().int().positive().optional(),
    order_item_id: z.number().int().positive(),
    delivered_quantity: z.number().int().positive(),
  }),
  z.object({
    id: z.number().int().positive().optional(),
    custom_order_item_id: z.number().int().positive(),
    delivered_quantity: z.number().int().positive(),
  }),
])

export const updateDeliverySchema = z.object({
  id: z.number().int().positive(),
  data: z.object({
    kind: z.enum(['DELIVERY', 'RETURN']).optional(),
    delivery_number: z.string().trim().min(1),
    delivery_date: z.date(),
    notes: z.string().nullable().optional(),
    items: z.array(updateDeliveryItemSchema).min(1),
  }),
})

export const updateDelivery = createServerFn()
  .inputValidator((data) => updateDeliverySchema.parse(data))
  .handler(async ({ data: { id: deliveryId, data } }) => {
    const { delivery_number, delivery_date, notes, items } = data

    try {
      const user = await requireAuth()
      await db.transaction(async (tx) => {
        const existingDelivery = await tx.query.deliveriesTable.findFirst({
          where: and(
            eq(deliveriesTable.id, deliveryId),
            isNull(deliveriesTable.deleted_at),
          ),
          columns: { id: true, kind: true },
        })

        if (!existingDelivery) fail('DELIVERY_NOT_FOUND')

        const kind: DeliveryKind = data.kind ?? existingDelivery.kind
        if (data.kind && data.kind !== existingDelivery.kind) {
          fail('DELIVERY_KIND_CHANGE_NOT_ALLOWED')
        }

        const headerUpdateData = {
          kind,
          delivery_number: delivery_number.trim(),
          delivery_date: normalizeDateForDB(delivery_date),
          notes: notes?.trim() || null,
          updated_at: sql`now()`,
        }

        const oldItems = await tx.query.deliveryItemsTable.findMany({
          where: and(
            eq(deliveryItemsTable.delivery_id, deliveryId),
            isNull(deliveryItemsTable.deleted_at),
          ),
          with: {
            orderItem: true,
            customOrderItem: true,
          },
        })

        const incomingItemsNormalized = normalizeDeliveryItemsForComparison(
          items.map((item) => ({
            delivered_quantity: item.delivered_quantity,
            order_item_id: 'order_item_id' in item ? item.order_item_id : null,
            custom_order_item_id:
              'custom_order_item_id' in item ? item.custom_order_item_id : null,
          })),
        )

        const existingItemsNormalized = normalizeDeliveryItemsForComparison(
          oldItems.map((item) => ({
            delivered_quantity: item.delivered_quantity,
            order_item_id: item.order_item_id,
            custom_order_item_id: item.custom_order_item_id,
          })),
        )

        const itemsChanged =
          incomingItemsNormalized.length !== existingItemsNormalized.length ||
          incomingItemsNormalized.some(
            (item, index) => item !== existingItemsNormalized[index],
          )

        if (!itemsChanged) {
          await tx
            .update(deliveriesTable)
            .set(headerUpdateData)
            .where(eq(deliveriesTable.id, deliveryId))
          return
        }

        if (kind === 'RETURN') {
          await assertReturnQuantitiesWithinDeliveredTx(tx, items, deliveryId)
        }

        // -------------------------------------------------------
        // 1️⃣ Revert and Clean ALL existing stock movements for this delivery
        // -------------------------------------------------------
        // We do this first to "clear the slate" in the stock history (with audit reversals)
        await internalStockMovementCleanupTx(
          tx,
          'delivery',
          deliveryId,
          user.id,
        )

        const affectedOrderIds = new Set<number>()
        for (const old of oldItems) {
          if (old.orderItem?.order_id)
            affectedOrderIds.add(old.orderItem.order_id)
          if (old.customOrderItem?.order_id)
            affectedOrderIds.add(old.customOrderItem.order_id)
        }

        // -------------------------------------------------------
        // 2️⃣ Diff & Sync Delivery Items
        // -------------------------------------------------------
        const newItems = items
        const itemsToInsert: typeof items = []
        const itemIdsToKeep = new Set<number>()

        for (const newItem of newItems) {
          const matchingOld = oldItems.find((old) => {
            if ('order_item_id' in newItem && 'order_item_id' in old) {
              return newItem.order_item_id === old.order_item_id
            }
            if (
              'custom_order_item_id' in newItem &&
              'custom_order_item_id' in old
            ) {
              return newItem.custom_order_item_id === old.custom_order_item_id
            }
            return false
          })

          if (matchingOld) {
            itemIdsToKeep.add(matchingOld.id)
            await tx
              .update(deliveryItemsTable)
              .set({
                delivered_quantity: newItem.delivered_quantity,
                updated_at: sql`now()`,
              })
              .where(eq(deliveryItemsTable.id, matchingOld.id))
          } else {
            itemsToInsert.push(newItem)
          }
        }

        // Soft-delete removed items
        const itemsToRemove = oldItems.filter(
          (old) => !itemIdsToKeep.has(old.id),
        )
        for (const toRemove of itemsToRemove) {
          await tx
            .update(deliveryItemsTable)
            .set({
              deleted_at: sql`now()`,
              updated_at: sql`now()`,
            })
            .where(eq(deliveryItemsTable.id, toRemove.id))
        }

        // Insert new items
        if (itemsToInsert.length > 0) {
          await tx.insert(deliveryItemsTable).values(
            itemsToInsert.map((item) => ({
              delivery_id: deliveryId,
              order_item_id:
                'order_item_id' in item ? item.order_item_id : null,
              custom_order_item_id:
                'custom_order_item_id' in item
                  ? item.custom_order_item_id
                  : null,
              delivered_quantity: item.delivered_quantity,
            })),
          )
        }

        // -------------------------------------------------------
        // 3️⃣ Re-apply Stock (For ALL active items in this delivery)
        // -------------------------------------------------------
        const allCurrentItems = await tx.query.deliveryItemsTable.findMany({
          where: and(
            eq(deliveryItemsTable.delivery_id, deliveryId),
            isNull(deliveryItemsTable.deleted_at),
          ),
          with: {
            orderItem: true,
          },
        })

        for (const item of allCurrentItems) {
          if (item.orderItem?.product_id) {
            const stockMovement = resolveDeliveryStockMovement(
              kind,
              item.delivered_quantity,
            )
            await createStockMovementTx(tx, {
              product_id: item.orderItem.product_id,
              quantity: stockMovement.quantity,
              movement_type: stockMovement.movementType,
              reference_type: 'delivery',
              reference_id: deliveryId,
              created_by: user.id,
              notes: `${stockMovement.notePrefix} update #${delivery_number}`,
            })

            if (item.orderItem.order_id)
              affectedOrderIds.add(item.orderItem.order_id)
          }
        }

        // -------------------------------------------------------
        // 4️⃣ Update delivery header
        // -------------------------------------------------------
        await tx
          .update(deliveriesTable)
          .set(headerUpdateData)
          .where(eq(deliveriesTable.id, deliveryId))

        // -------------------------------------------------------
        // 5️⃣ Update affected order statuses
        // -------------------------------------------------------
        for (const orderId of affectedOrderIds) {
          await updateOrderStatusIfComplete(tx, orderId)
        }
      })

      // -------------------------------------------------------
      // 8️⃣ Return fresh delivery
      // -------------------------------------------------------

      return await getDeliveryById({
        data: { id: deliveryId },
      })
    } catch (error) {
      console.error('[updateDelivery]', error)

      throw BaseAppError.create({
        code: 'DELIVERY_UPDATE_FAILED',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  })
