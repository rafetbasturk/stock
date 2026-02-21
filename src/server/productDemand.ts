import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, gte, ilike, lte, ne, or, sql } from 'drizzle-orm'
import { normalizeParams, notDeleted } from './utils'
import type { SQL } from 'drizzle-orm'
import { db } from '@/db'
import {
  customersTable,
  orderItemsTable,
  ordersTable,
  productsTable,
} from '@/db/schema'
import { productDemandSearchSchema } from '@/lib/types/types.search'

export const getPaginatedProductDemand = createServerFn()
  .inputValidator((data) => productDemandSearchSchema.parse(data))
  .handler(async ({ data }) => {
    const {
      pageIndex,
      pageSize,
      q,
      customerId,
      startDate: startDateRaw,
      endDate: endDateRaw,
      sortBy = 'avg_pieces_per_order',
      sortDir = 'desc',
    } = data

    const safePageIndex = Math.max(0, pageIndex)
    const safePageSize = Math.min(Math.max(10, pageSize), 100)

    const startDate = startDateRaw ? new Date(`${startDateRaw}T00:00:00`) : null
    const endDate = endDateRaw ? new Date(`${endDateRaw}T23:59:59.999`) : null

    const normalizedQ = normalizeParams(q)
    const normalizedCustomerId = normalizeParams(customerId)

    const conditions: Array<SQL> = [
      notDeleted(orderItemsTable),
      notDeleted(ordersTable),
      notDeleted(productsTable),
      notDeleted(customersTable),
      ne(ordersTable.status, 'İPTAL'),
    ]

    if (normalizedQ) {
      const search = `%${normalizedQ}%`
      conditions.push(
        or(
          ilike(productsTable.code, search),
          ilike(productsTable.name, search),
          ilike(customersTable.code, search),
          ilike(customersTable.name, search),
        )!,
      )
    }

    if (startDate) {
      conditions.push(gte(ordersTable.order_date, startDate))
    }

    if (endDate) {
      conditions.push(lte(ordersTable.order_date, endDate))
    }

    if (normalizedCustomerId) {
      const id = Number(normalizedCustomerId)
      if (Number.isInteger(id) && id > 0) {
        conditions.push(eq(ordersTable.customer_id, id))
      }
    }

    const whereExpr = conditions.length === 1 ? conditions[0] : and(...conditions)!

    const orderedTimesExpr = sql<number>`
      cast(count(distinct ${orderItemsTable.order_id}) as int)
    `.as('ordered_times')
    const totalPiecesExpr = sql<number>`
      cast(coalesce(sum(${orderItemsTable.quantity}), 0) as int)
    `.as('total_pieces')
    const avgPiecesExpr = sql<number>`
      cast(
        case
          when count(distinct ${orderItemsTable.order_id}) = 0 then 0
          else coalesce(sum(${orderItemsTable.quantity}), 0)::numeric
            / count(distinct ${orderItemsTable.order_id})
        end as numeric(12, 2)
      )
    `.as('avg_pieces_per_order')
    const lastOrderDateExpr =
      sql<Date | null>`max(${ordersTable.order_date})`.as('last_order_date')
    const customerIdExpr = sql<number>`${customersTable.id}`.as('customer_id')
    const customerCodeExpr =
      sql<string>`${customersTable.code}`.as('customer_code')
    const customerNameExpr =
      sql<string>`${customersTable.name}`.as('customer_name')
    const productIdExpr = sql<number>`${productsTable.id}`.as('product_id')
    const productCodeExpr = sql<string>`${productsTable.code}`.as('product_code')
    const productNameExpr = sql<string>`${productsTable.name}`.as('product_name')

    const baseQuery = db
      .select({
        customer_id: customerIdExpr,
        customer_code: customerCodeExpr,
        customer_name: customerNameExpr,
        product_id: productIdExpr,
        product_code: productCodeExpr,
        product_name: productNameExpr,
        ordered_times: orderedTimesExpr,
        total_pieces: totalPiecesExpr,
        avg_pieces_per_order: avgPiecesExpr,
        last_order_date: lastOrderDateExpr,
      })
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.order_id, ordersTable.id))
      .innerJoin(productsTable, eq(orderItemsTable.product_id, productsTable.id))
      .innerJoin(customersTable, eq(ordersTable.customer_id, customersTable.id))
      .where(whereExpr)
      .groupBy(
        customersTable.id,
        customersTable.code,
        customersTable.name,
        productsTable.id,
        productsTable.code,
        productsTable.name,
      )
      .as('product_demand')

    const dir = sortDir === 'asc' ? asc : desc

    const orderColumn =
      sortBy === 'total_pieces'
        ? baseQuery.total_pieces
        : sortBy === 'ordered_times'
          ? baseQuery.ordered_times
          : sortBy === 'last_order_date'
            ? baseQuery.last_order_date
            : sortBy === 'customer_code'
              ? baseQuery.customer_code
              : sortBy === 'product_code'
                ? baseQuery.product_code
                : baseQuery.avg_pieces_per_order

    const [totalResult, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(baseQuery),
      db
        .select()
        .from(baseQuery)
        .orderBy(
          dir(orderColumn),
          desc(baseQuery.avg_pieces_per_order),
          desc(baseQuery.total_pieces),
          desc(baseQuery.ordered_times),
          asc(baseQuery.customer_code),
          asc(baseQuery.product_code),
        )
        .limit(safePageSize)
        .offset(safePageIndex * safePageSize),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: rows.map((row) => ({
        ...row,
        ordered_times: Number(row.ordered_times),
        total_pieces: Number(row.total_pieces),
        avg_pieces_per_order: Number(row.avg_pieces_per_order),
      })),
      pageIndex: safePageIndex,
      pageSize: safePageSize,
      total,
      pageCount: Math.ceil(total / safePageSize),
    }
  })
