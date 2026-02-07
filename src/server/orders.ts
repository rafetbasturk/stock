// src/server/orders.ts
import { createServerFn } from '@tanstack/react-start'
import {
  and,
  desc as drizzleDesc,
  eq,
  gte,
  inArray,
  isNull,
  like,
  lte,
  sql,
} from 'drizzle-orm'
import z from 'zod'
import { addTotalAmount } from './utils'
import type { OrderSubmitPayload } from '@/types'
import { db } from '@/db'
import {
  customOrderItemsTable,
  customersTable,
  orderItemsTable,
  ordersTable,
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

const orderSortFields = [
  'order_number',
  'order_date',
  'status',
  'currency',
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

    const startDate = startDateRaw
      ? new Date(`${startDateRaw}T00:00:00`)
      : null
    const endDate = endDateRaw
      ? new Date(`${endDateRaw}T23:59:59.999`)
      : null

    const normalizedQ = normalizeParams(q)
    const normalizedStatus = normalizeParams(status)
    const normalizedCustomerId = normalizeParams(customerId)

    const conditions = [isNull(ordersTable.deleted_at)]

    if (normalizedQ) {
      conditions.push(like(ordersTable.order_number, `%${normalizedQ}%`))
    }

    if (startDate) {
      conditions.push(gte(ordersTable.order_date, startDate))
    }

    if (endDate) {
      conditions.push(lte(ordersTable.order_date, endDate))
    }

    if (normalizedStatus) {
      const values = normalizedStatus.split('|').filter(Boolean)
      if (values.length > 1) {
        conditions.push(
          inArray(
            ordersTable.status,
            values as Array<(typeof statusArray)[number]>,
          ),
        )
      } else if (values[0]) {
        conditions.push(eq(ordersTable.status, values[0] as (typeof statusArray)[number]))
      }
    }

    if (normalizedCustomerId) {
      const ids = normalizedCustomerId
        .split('|')
        .filter(Boolean)
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)

      if (ids.length > 1) {
        conditions.push(inArray(ordersTable.customer_id, ids))
      } else if (ids.length === 1) {
        conditions.push(eq(ordersTable.customer_id, ids[0]))
      }
    }

    const whereExpr = conditions.length ? and(...conditions) : undefined

    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
    if (whereExpr) totalQuery.where(whereExpr)

    const totalResult = await totalQuery
    const total = totalResult[0]?.count ?? 0

    const orders = await db.query.ordersTable.findMany({
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
      ...(whereExpr && { where: () => whereExpr }),
      limit: safePageSize,
      offset: safePageIndex * safePageSize,
      orderBy: (o, { asc, desc: descSort }) => {
        const sortField = sortBy ?? 'order_date'
        const direction = sortDir === 'asc' ? 'asc' : 'desc'
        const dir = direction === 'desc' ? descSort : asc

        switch (sortField) {
          case 'order_number':
            return [dir(o.order_number), descSort(o.order_date)]
          case 'order_date':
            return [dir(o.order_date), descSort(o.order_number)]
          case 'status':
            return [dir(o.status)]
          case 'currency':
            return [dir(o.currency)]
          default:
            return [dir(o.order_date), descSort(o.order_number)]
        }
      },
    })

    return {
      data: orders.map(addTotalAmount),
      pageIndex: safePageIndex,
      pageSize: safePageSize,
      total,
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
          status: order.status,
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
          .filter((item) => Number.isInteger(item.product_id) && item.product_id > 0)
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
          .filter((item) => Number.isInteger(item.product_id) && item.product_id > 0)
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

  const statuses = statusRows
    .map((s) => s.status)
    .sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' }))

  const customerRows = await db
    .selectDistinct({
      customer_id: ordersTable.customer_id,
      customer_name: customersTable.name,
    })
    .from(ordersTable)
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
