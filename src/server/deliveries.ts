// src/server/deliveries.ts
import { createServerFn } from '@tanstack/react-start'
import {
  and,
  desc as drizzleDesc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
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
import { db } from '@/db'
import {
  customersTable,
  deliveriesTable,
  deliveryItemsTable,
  orderItemsTable,
} from '@/db/schema'
import { fail } from '@/lib/error/core/serverError'
import { BaseAppError } from '@/lib/error/core'
import { createStockMovementTx } from './stock.service'

export interface CreateDeliveryInput {
  customer_id: number
  delivery_number: string
  delivery_date: Date | string
  notes?: string
  items: (
    | { order_item_id: number; delivered_quantity: number }
    | { custom_order_item_id: number; delivered_quantity: number }
  )[]
}

export const createDelivery = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateDeliveryInput) => data)
  .handler(async ({ data }) => {
    const { customer_id, delivery_number, delivery_date, notes, items } = data

    if (!customer_id) {
      throw fail('CUSTOMER_NOT_FOUND')
    }

    if (!items?.length) {
      throw fail('DELIVERY_NOT_FOUND')
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

          if (new Set(ids).size !== ids.length)
            throw BaseAppError.create({
              code: 'DUPLICATE_ORDER_ITEM',
            })

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
            throw BaseAppError.create({
              code: 'ORDER_ITEM_NOT_FOUND',
            })

          for (const item of standardItems) {
            if (item.delivered_quantity <= 0)
              throw BaseAppError.create({
                code: 'INVALID_DELIVERY_QUANTITY',
              })

            const orderItem = standardOrderItems.find(
              (oi) => oi.id === item.order_item_id,
            )

            if (!orderItem?.product)
              throw BaseAppError.create({
                code: 'ORDER_ITEM_MISSING_PRODUCT',
              })

            if (orderItem.order_id) affectedOrderIds.add(orderItem.order_id)
          }
        }

        /*───────────────────────────────────────────────
          2️⃣ INSERT DELIVERY HEADER
        ───────────────────────────────────────────────*/
        const [delivery] = await tx
          .insert(deliveriesTable)
          .values({
            customer_id,
            delivery_number,
            delivery_date: normalizeDateForDB(delivery_date),
            notes,
          })
          .returning()

        if (!delivery) {
          throw fail('DELIVERY_CREATION_FAILED')
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

            if (!orderItem)
              throw BaseAppError.create({
                code: 'ORDER_ITEM_NOT_FOUND',
              })

            if (!orderItem.product_id)
              throw BaseAppError.create({
                code: 'ORDER_ITEM_INVALID',
              })

            await createStockMovementTx(tx, {
              product_id: orderItem.product_id,

              quantity: -item.delivered_quantity,

              movement_type: 'OUT',

              reference_type: 'delivery',

              reference_id: delivery.id,

              created_by: 1, // replace with session user later

              notes: `Delivery #${delivery.delivery_number}`,
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

      throw BaseAppError.create({ code: 'DELIVERY_CREATION_FAILED' })
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

export const getDeliveryById = createServerFn({ method: 'GET' })
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

const deliverySortFields = [
  'delivery_number',
  'delivery_date',
  'customer',
] as const

const paginatedSchema = z.object({
  pageIndex: z.number().int(),
  pageSize: z.number().int(),
  q: z.string().trim().optional(),
  sortBy: z.enum(deliverySortFields).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  customerId: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
})

export const getPaginatedDeliveries = createServerFn({ method: 'POST' })
  .inputValidator((data) => paginatedSchema.parse(data))
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
    } = data

    const safePageIndex = Math.max(0, pageIndex)
    const safePageSize = Math.min(Math.max(10, pageSize), 100)

    const startDate = startDateRaw ? new Date(`${startDateRaw}T00:00:00`) : null
    const endDate = endDateRaw ? new Date(`${endDateRaw}T23:59:59.999`) : null

    const normalizedQ = normalizeParams(q)
    const normalizedCustomerId = normalizeParams(customerId)

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

    if (startDate) {
      conditions.push(gte(deliveriesTable.delivery_date, startDate))
    }

    if (endDate) {
      conditions.push(lte(deliveriesTable.delivery_date, endDate))
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

          switch (sortBy) {
            case 'delivery_number':
              return [dir(d.delivery_number), desc(d.delivery_date), asc(d.id)]

            case 'delivery_date':
              return [dir(d.delivery_date), desc(d.delivery_number), asc(d.id)]

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

export const removeDelivery = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data: { id } }) => {
    await db
      .update(deliveriesTable)
      .set({
        deleted_at: sql`now()`,
        updated_at: sql`now()`,
      })
      .where(eq(deliveriesTable.id, id))

    return { success: true }
  })

export const getLastDeliveryNumber = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [lastDelivery] = await db
      .select({
        delivery_number: deliveriesTable.delivery_number,
      })
      .from(deliveriesTable)
      .orderBy(
        drizzleDesc(deliveriesTable.created_at),
        drizzleDesc(deliveriesTable.id),
      )
      .limit(1)

    return lastDelivery.delivery_number
  },
)

export const getDeliveryFilterOptions = createServerFn({
  method: 'GET',
}).handler(async () => {
  const customerRows = await db
    .selectDistinct({
      customer_id: deliveriesTable.customer_id,
      customer_name: customersTable.name,
    })
    .from(deliveriesTable)
    .where(isNull(customersTable.deleted_at))
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
