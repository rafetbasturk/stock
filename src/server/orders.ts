// src/server/orders.ts
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
  sql,
} from 'drizzle-orm'
import z from 'zod'
import { addTotalAmount, notDeleted } from './utils'
import type { SQL } from 'drizzle-orm'
import type { OrderSubmitPayload } from '@/types'
import { db } from '@/db'
import {
  customOrderItemsTable,
  customersTable,
  deliveriesTable,
  deliveryItemsTable,
  orderItemsTable,
  ordersTable,
  productsTable,
} from '@/db/schema'
import { statusArray, unitArray } from '@/lib/constants'
import { currencyArray } from '@/lib/currency'
import { BaseAppError } from '@/lib/error/core'

export const getOrders = createServerFn().handler(async () => {
  const ordersRaw = await db.query.ordersTable.findMany({
    with: {
      customer: true,
      items: {
        with: {
          product: true,
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
        orderBy: (items, { asc }) => [asc(items.created_at)],
      },
      customItems: {
        with: {
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
    },
    where: (o) => notDeleted(o),
    orderBy: (order, { asc }) => [asc(order.order_number)],
  })

  return ordersRaw.map(addTotalAmount)
})

export const getYearRange = createServerFn().handler(async () => {
  const result = await db
    .select({
      minYear: sql<
        number | null
      >`MIN(EXTRACT(YEAR FROM ${ordersTable.order_date}))`,
      maxYear: sql<
        number | null
      >`MAX(EXTRACT(YEAR FROM ${ordersTable.order_date}))`,
    })
    .from(ordersTable)

  const { minYear, maxYear } = result[0] ?? {}
  const currentYear = new Date().getFullYear()

  return {
    minYear: minYear ?? currentYear,
    maxYear: maxYear ?? currentYear,
  }
})

export const getOrderById = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const order = await db.query.ordersTable.findFirst({
      with: {
        customer: true,
        items: {
          with: {
            product: true,
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
          orderBy: (items, { asc }) => [asc(items.created_at)],
        },
        customItems: {
          with: {
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
      },
      where: (o, { eq: eqFn }) => eqFn(o.id, data.id),
    })

    return order ? addTotalAmount(order) : null
  })

export const getOrderDeliveries = createServerFn({ method: 'GET' })
  .inputValidator((data: { orderId: number }) => data)
  .handler(async ({ data: { orderId } }) => {
    const [standardRefs, customRefs] = await Promise.all([
      db
        .selectDistinct({
          delivery_id: deliveryItemsTable.delivery_id,
        })
        .from(deliveryItemsTable)
        .innerJoin(
          orderItemsTable,
          eq(orderItemsTable.id, deliveryItemsTable.order_item_id),
        )
        .where(
          and(
            eq(orderItemsTable.order_id, orderId),
            notDeleted(orderItemsTable),
            notDeleted(deliveryItemsTable),
          ),
        ),
      db
        .selectDistinct({
          delivery_id: deliveryItemsTable.delivery_id,
        })
        .from(deliveryItemsTable)
        .innerJoin(
          customOrderItemsTable,
          eq(customOrderItemsTable.id, deliveryItemsTable.custom_order_item_id),
        )
        .where(
          and(
            eq(customOrderItemsTable.order_id, orderId),
            notDeleted(customOrderItemsTable),
            notDeleted(deliveryItemsTable),
          ),
        ),
    ])

    const deliveryIds = Array.from(
      new Set(
        [...standardRefs, ...customRefs]
          .map((ref) => ref.delivery_id)
          .filter((id): id is number => Number.isInteger(id)),
      ),
    )

    if (deliveryIds.length === 0) {
      return []
    }

    const deliveries = await db.query.deliveriesTable.findMany({
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
      where: and(
        inArray(deliveriesTable.id, deliveryIds),
        notDeleted(deliveriesTable),
      ),
      orderBy: (d, { desc }) => [desc(d.delivery_date), desc(d.id)],
    })

    return deliveries.map(addTotalAmount)
  })

const orderSortFields = [
  'order_number',
  'order_date',
  'status',
  'currency',
  'customer',
] as const

const paginatedSchema = z.object({
  pageIndex: z.number().int(),
  pageSize: z.number().int(),
  q: z.string().trim().optional(),
  sortBy: z.enum(orderSortFields).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  status: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
})

function normalizeParams(value?: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

export const getPaginatedOrders = createServerFn({ method: 'POST' })
  .inputValidator((data) => paginatedSchema.parse(data))
  .handler(async ({ data }) => {
    const {
      pageIndex,
      pageSize,
      startDate: startDateRaw,
      endDate: endDateRaw,
      q,
      status,
      customerId,
      sortBy,
      sortDir,
    } = data

    const safePageIndex = Math.max(0, pageIndex)
    const safePageSize = Math.min(Math.max(10, pageSize), 100)

    const startDate = startDateRaw ? new Date(`${startDateRaw}T00:00:00`) : null

    const endDate = endDateRaw ? new Date(`${endDateRaw}T23:59:59.999`) : null

    const normalizedQ = normalizeParams(q)
    const normalizedStatus = normalizeParams(status)
    const normalizedCustomerId = normalizeParams(customerId)

    const conditions: Array<SQL> = [notDeleted(ordersTable)]

    // Search
    if (normalizedQ) {
      const search = `%${normalizedQ}%`
      conditions.push(
        or(
          ilike(ordersTable.order_number, search),
          ilike(ordersTable.notes, search),
        )!,
      )
    }

    if (startDate) {
      conditions.push(gte(ordersTable.order_date, startDate))
    }

    if (endDate) {
      conditions.push(lte(ordersTable.order_date, endDate))
    }

    if (normalizedStatus) {
      const values = normalizedStatus.split(',').filter(Boolean)

      if (values.length > 1)
        conditions.push(inArray(ordersTable.status, values as any))
      else conditions.push(eq(ordersTable.status, values[0] as any))
    }

    if (normalizedCustomerId) {
      const ids = normalizedCustomerId
        .split('|')
        .map(Number)
        .filter((n) => Number.isInteger(n))

      if (ids.length > 1) conditions.push(inArray(ordersTable.customer_id, ids))
      else if (ids.length === 1)
        conditions.push(eq(ordersTable.customer_id, ids[0]))
    }

    const whereExpr: SQL =
      conditions.length === 1 ? conditions[0] : and(...conditions)!

    // Ranking
    const rankingExpr = normalizedQ
      ? sql<number>`
        (
          CASE
            WHEN ${ordersTable.order_number} = ${normalizedQ}
            THEN 1000 ELSE 0
          END
          +
          similarity(${ordersTable.order_number}, ${normalizedQ}) * 100
          +
          similarity(${ordersTable.notes}, ${normalizedQ}) * 10
        )
      `
      : undefined

    const [totalResult, orders] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(ordersTable)
        .where(whereExpr),

      db.query.ordersTable.findMany({
        with: {
          customer: true,
          items: {
            with: {
              product: true,
              deliveries: {
                with: { delivery: true },
              },
            },
          },
          customItems: true,
        },
        where: () => whereExpr,
        limit: safePageSize,
        offset: safePageIndex * safePageSize,

        orderBy: (o, { asc, desc }) => {
          if (normalizedQ && rankingExpr)
            return [desc(rankingExpr), desc(o.order_date), asc(o.id)]

          const dir = sortDir === 'asc' ? asc : desc

          switch (sortBy) {
            case 'order_number':
              return [dir(o.order_number), desc(o.order_date), asc(o.id)]

            case 'order_date':
              return [dir(o.order_date), desc(o.order_number), asc(o.id)]

            case 'status':
              return [dir(o.status), desc(o.order_date), asc(o.id)]

            case 'currency':
              return [dir(o.currency), desc(o.order_date), asc(o.id)]

            default:
              return [desc(o.order_date), asc(o.id)]
          }
        },
      }),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: orders.map(addTotalAmount),
      pageIndex: safePageIndex,
      pageSize: safePageSize,
      total,
      pageCount: Math.ceil(total / safePageSize),
    }
  })

export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator((data: OrderSubmitPayload) => data)
  .handler(async ({ data: order }) => {
    if (!order.order_number.trim()) {
      throw BaseAppError.create({
        status: 400,
        code: 'VALIDATION_ERROR',
      })
    }

    if (!Number.isInteger(order.customer_id) || order.customer_id <= 0) {
      throw BaseAppError.create({
        status: 400,
        code: 'INVALID_ID',
      })
    }

    const orderId = await db.transaction(async (tx) => {
      try {
        // 🧩 1️⃣ Check stock only for standard orders
        let allItemsInStock = true

        if (!order.is_custom_order && order.items.length > 0) {
          const productIds = order.items.map((item) => item.product_id)

          const products = await tx
            .select({
              id: productsTable.id,
              stock_quantity: productsTable.stock_quantity,
            })
            .from(productsTable)
            .where(inArray(productsTable.id, productIds))

          // Check if all requested products exist
          const uniqueProductIds = new Set(productIds)
          if (products.length !== uniqueProductIds.size) {
            throw BaseAppError.create({
              status: 400,
              code: 'PRODUCT_NOT_FOUND',
              message: 'One or more products not found',
            })
          }

          const stockMap = new Map(
            products.map((p) => [p.id, p.stock_quantity]),
          )

          for (const item of order.items) {
            const currentStock = stockMap.get(item.product_id) || 0
            if (currentStock < item.quantity) {
              allItemsInStock = false
              break
            }
          }
        }

        // Determine status based on stock availability
        // If custom order or no items, default to 'KAYIT' (or whatever was passed if we wanted to respect it, but requirement says override)
        // Actually requirement says: "sets orderStatus to 'HAZIR' if the stock is available... otherwise 'KAYIT'"
        // It implies 'KAYIT' is the default if not ready.
        const calculatedStatus =
          !order.is_custom_order && order.items.length > 0 && allItemsInStock
            ? 'HAZIR'
            : 'KAYIT'

        const [newOrder] = await tx
          .insert(ordersTable)
          .values({
            is_custom_order: Boolean(order.is_custom_order),
            order_number: order.order_number.trim(),
            order_date: order.order_date,
            delivery_address: order.delivery_address
              ? order.delivery_address.trim()
              : null,
            customer_id: order.customer_id,
            status: calculatedStatus,
            currency: order.currency,
            notes: order.notes ? order.notes.trim() : null,
          })
          .returning({ id: ordersTable.id })

        if (order.is_custom_order) {
          const customItemsToInsert = order.customItems
            .filter((item) => (item.name?.trim().length ?? 0) > 0)
            .map((item) => ({
              order_id: newOrder.id,
              name: item.name?.trim() || '',
              unit: unitArray.includes(item.unit as (typeof unitArray)[number])
                ? (item.unit as (typeof unitArray)[number])
                : 'adet',
              quantity: Math.max(1, item.quantity ?? 1),
              unit_price: Math.max(0, item.unit_price ?? 0),
              currency: order.currency ?? 'TRY',
              notes: item.notes?.trim() || null,
            }))

          if (customItemsToInsert.length > 0) {
            await tx.insert(customOrderItemsTable).values(customItemsToInsert)
          }
        } else {
          const itemsToInsert = order.items
            .filter(
              (item) =>
                Number.isInteger(item.product_id) && item.product_id > 0,
            )
            .map((item) => ({
              order_id: newOrder.id,
              product_id: item.product_id,
              quantity: Math.max(1, item.quantity),
              unit_price: Math.max(0, item.unit_price),
              currency: order.currency ?? 'TRY',
            }))

          if (itemsToInsert.length > 0) {
            await tx.insert(orderItemsTable).values(itemsToInsert)
          }
        }

        return newOrder.id
      } catch (error) {
        console.error('Order creation failed:', error)
        throw error
      }
    })

    return await getOrderById({ data: { id: orderId } })
  })

const updateOrderSchema = z.object({
  id: z.number().int().positive(),
  data: z.object({
    is_custom_order: z.boolean().optional(),
    order_number: z.string().trim().min(1),
    order_date: z.date(),
    delivery_address: z.string().nullable().optional(),
    customer_id: z.number().int().positive(),
    status: z.enum(statusArray),
    currency: z.enum(currencyArray).nullable().optional(),
    notes: z.string().nullable().optional(),
    items: z
      .array(
        z.object({
          id: z.number().int().positive().optional(),
          product_id: z.number().int().positive(),
          unit_price: z.number().int().nonnegative(),
          quantity: z.number().int().positive(),
          currency: z.enum(currencyArray).nullable().optional(),
        }),
      )
      .default([]),
    customItems: z
      .array(
        z.object({
          id: z.number().int().positive().optional(),
          name: z.string().optional(),
          unit: z.string().optional(),
          quantity: z.number().int().positive().optional(),
          unit_price: z.number().int().nonnegative().optional(),
          currency: z.enum(currencyArray).nullable().optional(),
          notes: z.string().optional(),
        }),
      )
      .default([]),
  }),
})

export const updateOrder = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateOrderSchema.parse(data))
  .handler(async ({ data: { id, data: order } }) => {
    await db.transaction(async (tx) => {
      const updatedOrders = await tx
        .update(ordersTable)
        .set({
          is_custom_order: Boolean(order.is_custom_order),
          order_number: order.order_number.trim(),
          order_date: order.order_date,
          delivery_address: order.delivery_address
            ? order.delivery_address.trim()
            : null,
          customer_id: order.customer_id,
          status: order.status,
          currency: order.currency,
          notes: order.notes ? order.notes.trim() : null,
          updated_at: sql`now()`,
        })
        .where(and(eq(ordersTable.id, id), isNull(ordersTable.deleted_at)))
        .returning({ id: ordersTable.id })

      if (updatedOrders.length === 0) {
        throw BaseAppError.create({
          code: 'ORDER_NOT_FOUND',
          status: 404,
        })
      }

      await tx.delete(orderItemsTable).where(eq(orderItemsTable.order_id, id))
      await tx
        .delete(customOrderItemsTable)
        .where(eq(customOrderItemsTable.order_id, id))

      if (order.is_custom_order) {
        const customItemsToInsert = order.customItems
          .filter((item) => (item.name?.trim().length ?? 0) > 0)
          .map((item) => ({
            order_id: id,
            name: item.name?.trim() || '',
            unit: unitArray.includes(item.unit as (typeof unitArray)[number])
              ? (item.unit as (typeof unitArray)[number])
              : 'adet',
            quantity: Math.max(1, item.quantity ?? 1),
            unit_price: Math.max(0, item.unit_price ?? 0),
            currency: order.currency ?? 'TRY',
            notes: item.notes?.trim() || null,
          }))

        if (customItemsToInsert.length > 0) {
          await tx.insert(customOrderItemsTable).values(customItemsToInsert)
        }
      } else {
        const itemsToInsert = order.items
          .filter(
            (item) => Number.isInteger(item.product_id) && item.product_id > 0,
          )
          .map((item) => ({
            order_id: id,
            product_id: item.product_id,
            quantity: Math.max(1, item.quantity),
            unit_price: Math.max(0, item.unit_price),
            currency: order.currency ?? 'TRY',
          }))

        if (itemsToInsert.length > 0) {
          await tx.insert(orderItemsTable).values(itemsToInsert)
        }
      }
    })

    return await getOrderById({ data: { id } })
  })

export const removeOrder = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data: { id } }) => {
    await db
      .update(ordersTable)
      .set({
        deleted_at: sql`now()`,
        updated_at: sql`now()`,
      })
      .where(eq(ordersTable.id, id))

    return { success: true }
  })

export const getLastOrderNumber = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [lastOrder] = await db
      .select({
        order_number: ordersTable.order_number,
      })
      .from(ordersTable)
      .orderBy(drizzleDesc(ordersTable.created_at), drizzleDesc(ordersTable.id))
      .limit(1)

    return lastOrder.order_number
  },
)

export const getOrderFilterOptions = createServerFn({
  method: 'GET',
}).handler(async () => {
  const statusRows = await db
    .selectDistinct({ status: ordersTable.status })
    .from(ordersTable)
    .where(notDeleted(ordersTable))

  const statuses = statusRows
    .map((s) => s.status)
    .sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' }))

  const customerRows = await db
    .selectDistinct({
      customer_id: ordersTable.customer_id,
      customer_name: customersTable.name,
    })
    .from(ordersTable)
    .where(isNull(customersTable.deleted_at))
    .innerJoin(customersTable, eq(customersTable.id, ordersTable.customer_id))

  const customers = customerRows
    .map((row) => ({
      id: row.customer_id,
      name: row.customer_name.trim(),
    }))
    .filter((row) => row.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }))

  return {
    statuses,
    customers,
  }
})
