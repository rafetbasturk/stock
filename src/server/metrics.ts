// src/server/metrics.ts
import { createServerFn } from '@tanstack/react-start'
import { and, eq, gte, inArray, lt, ne } from 'drizzle-orm'
import { notDeleted } from './utils'
import type { SQL } from 'drizzle-orm'
import type { Rate } from '@/lib/currency'
import type { Currency } from '@/types'
import { db } from '@/db'
import {
  customOrderItemsTable,
  deliveriesTable,
  deliveryItemsTable,
  orderItemsTable,
  ordersTable,
} from '@/db/schema'
import { convertToBaseCurrency } from '@/lib/currency'
import { AppError } from '@/lib/error/core/AppError'
import { fail } from '@/lib/error/core/serverError'

export type GetKeyMetricsData = {
  rates: Array<Rate>
  filters?: { customerId?: number; year?: number }
  preferredCurrency?: Currency
}

export const getKeyMetrics = createServerFn()
  .inputValidator((data: GetKeyMetricsData) => data)
  .handler(async ({ data }) => {
    try {
      const { customerId, year } = data.filters ?? {}

      const whereConditions = [
        notDeleted(ordersTable),
        ne(ordersTable.status, 'İPTAL'),
      ]

      if (customerId)
        whereConditions.push(eq(ordersTable.customer_id, customerId))
      if (typeof year === 'number') {
        const start = new Date(year, 0, 1)
        const end = new Date(year + 1, 0, 1)

        whereConditions.push(gte(ordersTable.order_date, start))
        whereConditions.push(lt(ordersTable.order_date, end))
      }

      // 🔹 1️⃣ Get relevant orders
      const orders = await db
        .select({
          id: ordersTable.id,
          currency: ordersTable.currency,
          status: ordersTable.status,
          order_date: ordersTable.order_date,
        })
        .from(ordersTable)
        .where(and(...whereConditions))

      if (orders.length === 0)
        return {
          totalOrders: 0,
          totalRevenue: 0,
          deliveredRevenue: 0,
          avgOrderValue: 0,
          maxOrderValue: 0,
          minOrderValue: 0,
          ordersThisMonth: 0,
          pendingOrders: 0,
        }

      const orderIds = orders.map((o) => o.id)

      // 🔹 2️⃣ Get order items
      const orderItems = await db
        .select({
          order_id: orderItemsTable.order_id,
          quantity: orderItemsTable.quantity,
          unit_price: orderItemsTable.unit_price,
          currency: orderItemsTable.currency,
        })
        .from(orderItemsTable)
        .where(
          and(
            inArray(orderItemsTable.order_id, orderIds),
            notDeleted(orderItemsTable),
          ),
        )

      const customOrderItems = await db
        .select({
          order_id: customOrderItemsTable.order_id,
          quantity: customOrderItemsTable.quantity,
          unit_price: customOrderItemsTable.unit_price,
          currency: customOrderItemsTable.currency,
        })
        .from(customOrderItemsTable)
        .where(
          and(
            inArray(customOrderItemsTable.order_id, orderIds),
            notDeleted(customOrderItemsTable),
          ),
        )

      const allItems = [...orderItems, ...customOrderItems]

      // 🔹 3️⃣ Total revenue per order
      const orderRevenueMap = new Map<number, number>()
      for (const item of allItems) {
        try {
          const amount = item.unit_price * item.quantity
          const converted = convertToBaseCurrency(
            amount,
            item.currency,
            data.preferredCurrency ?? 'TRY',
            data.rates,
          )
          orderRevenueMap.set(
            item.order_id,
            (orderRevenueMap.get(item.order_id) ?? 0) + converted,
          )
        } catch (error) {
          if (error instanceof AppError) {
            throw error // keep currency-specific code
          }
          fail('METRICS_FETCH_FAILED')
        }
      }

      // 🔹 4️⃣ Delivered revenue — join delivery_items with both item tables
      const deliveries = await db
        .select({
          delivered_quantity: deliveryItemsTable.delivered_quantity,
          kind: deliveriesTable.kind,
          standard_order_id: orderItemsTable.order_id,
          standard_price: orderItemsTable.unit_price,
          standard_currency: orderItemsTable.currency,
          custom_order_id: customOrderItemsTable.order_id,
          custom_price: customOrderItemsTable.unit_price,
          custom_currency: customOrderItemsTable.currency,
        })
        .from(deliveryItemsTable)
        .innerJoin(
          deliveriesTable,
          eq(deliveryItemsTable.delivery_id, deliveriesTable.id),
        )
        .leftJoin(
          orderItemsTable,
          eq(deliveryItemsTable.order_item_id, orderItemsTable.id),
        )
        .leftJoin(
          customOrderItemsTable,
          eq(deliveryItemsTable.custom_order_item_id, customOrderItemsTable.id),
        )
        .where(and(notDeleted(deliveryItemsTable), notDeleted(deliveriesTable)))

      const deliveredMap = new Map<number, number>()

      for (const d of deliveries) {
        const orderId = d.standard_order_id ?? d.custom_order_id
        if (!orderId || !orderIds.includes(orderId)) continue

        const unitPrice = d.standard_price ?? d.custom_price ?? 0
        const currency = d.standard_currency ?? d.custom_currency ?? 'TRY'
        const signedQuantity =
          d.kind === 'RETURN' ? -d.delivered_quantity : d.delivered_quantity
        const deliveredAmount = signedQuantity * unitPrice

        const converted = convertToBaseCurrency(
          deliveredAmount,
          currency,
          data.preferredCurrency ?? 'TRY',
          data.rates,
        )
        deliveredMap.set(orderId, (deliveredMap.get(orderId) ?? 0) + converted)
      }

      // 🔹 5️⃣ Aggregate metrics
      const revenues = Array.from(orderRevenueMap.values())

      const deliveredRevenues = Array.from(deliveredMap.values())

      const totalRevenue = revenues.reduce((a, b) => a + b, 0)

      const deliveredRevenue = deliveredRevenues.reduce((a, b) => a + b, 0)

      const totalOrders = orders.length

      const pendingOrders = orders.filter(
        (o) => o.status !== 'BİTTİ' && o.status !== 'İPTAL',
      ).length

      return {
        totalOrders,
        totalRevenue,
        deliveredRevenue,
        pendingOrders,
      }
    } catch (error) {
      console.error('[getKeyMetrics] failed:', error)

      if (error instanceof AppError) {
        throw error // already classified
      }

      fail('METRICS_FETCH_FAILED')
    }
  })

export const getMonthlyOverview = createServerFn()
  .inputValidator(
    (data: {
      filters?: { customerId?: number; year?: number }
      monthCount?: number
      rates: Array<Rate>
      preferredCurrency: Currency
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const { customerId, year } = data.filters ?? {}
      const preferredCurrency = data.preferredCurrency
      const rates = data.rates

      const now = new Date()
      const safeMonthCount = Math.max(1, data.monthCount ?? 12)

      let start: Date
      let end: Date

      const months =
        typeof year === 'number'
          ? Array.from({ length: 12 }, (_, i) => ({
              yearMonth: `${year}-${String(i + 1).padStart(2, '0')}`,
              monthIndex: i,
            }))
          : Array.from({ length: safeMonthCount }, (_, i) => {
              const d = new Date(now)
              d.setDate(1)
              d.setMonth(now.getMonth() - (safeMonthCount - 1 - i))

              return {
                yearMonth: `${d.getFullYear()}-${String(
                  d.getMonth() + 1,
                ).padStart(2, '0')}`,
                monthIndex: d.getMonth(),
              }
            })

      if (typeof year === 'number') {
        start = new Date(year, 0, 1)
        end = new Date(year + 1, 0, 1)
      } else {
        start = new Date(
          now.getFullYear(),
          now.getMonth() - (safeMonthCount - 1),
          1,
        )
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }

      //
      // STEP 1 — FETCH ORDERS
      //

      const orderWhere: Array<SQL> = [
        notDeleted(ordersTable),
        ne(ordersTable.status, 'İPTAL'),
        gte(ordersTable.order_date, start),
        lt(ordersTable.order_date, end),
      ]

      const deliveriesWhere: Array<SQL> = [
        notDeleted(deliveriesTable),
        gte(deliveriesTable.delivery_date, start),
        lt(deliveriesTable.delivery_date, end),
      ]

      if (customerId) {
        orderWhere.push(eq(ordersTable.customer_id, customerId))
        deliveriesWhere.push(eq(deliveriesTable.customer_id, customerId))
      }

      const orders = await db
        .select({
          id: ordersTable.id,
          order_date: ordersTable.order_date,
        })
        .from(ordersTable)
        .where(and(...orderWhere))

      if (orders.length === 0)
        return months.map(({ monthIndex }) => ({
          monthIndex,
          orders: 0,
          deliveries: 0,
          revenue: 0,
          deliveredRevenue: 0,
        }))

      const orderIds = orders.map((o) => o.id)

      //
      // STEP 2 — FETCH ORDER ITEMS
      //

      const [orderItems, customOrderItems] = await Promise.all([
        db
          .select({
            order_id: orderItemsTable.order_id,
            quantity: orderItemsTable.quantity,
            unit_price: orderItemsTable.unit_price,
            currency: orderItemsTable.currency,
          })
          .from(orderItemsTable)
          .where(
            and(
              inArray(orderItemsTable.order_id, orderIds),
              notDeleted(orderItemsTable),
            ),
          ),

        db
          .select({
            order_id: customOrderItemsTable.order_id,
            quantity: customOrderItemsTable.quantity,
            unit_price: customOrderItemsTable.unit_price,
            currency: customOrderItemsTable.currency,
          })
          .from(customOrderItemsTable)
          .where(
            and(
              inArray(customOrderItemsTable.order_id, orderIds),
              notDeleted(customOrderItemsTable),
            ),
          ),
      ])

      //
      // STEP 3 — FETCH DELIVERIES WITH delivery_date
      //

      const deliveries = await db
        .select({
          delivery_id: deliveryItemsTable.delivery_id,
          delivery_date: deliveriesTable.delivery_date,
          kind: deliveriesTable.kind,

          delivered_quantity: deliveryItemsTable.delivered_quantity,

          standard_order_id: orderItemsTable.order_id,
          standard_price: orderItemsTable.unit_price,
          standard_currency: orderItemsTable.currency,

          custom_order_id: customOrderItemsTable.order_id,
          custom_price: customOrderItemsTable.unit_price,
          custom_currency: customOrderItemsTable.currency,
        })
        .from(deliveryItemsTable)
        .where(and(...deliveriesWhere, notDeleted(deliveryItemsTable)))
        .leftJoin(
          deliveriesTable,
          eq(deliveryItemsTable.delivery_id, deliveriesTable.id),
        )
        .leftJoin(
          orderItemsTable,
          eq(deliveryItemsTable.order_item_id, orderItemsTable.id),
        )
        .leftJoin(
          customOrderItemsTable,
          eq(deliveryItemsTable.custom_order_item_id, customOrderItemsTable.id),
        )

      //
      // STEP 4 — AGGREGATION (FAST O(n))
      //

      const result = new Map<
        string,
        {
          orders: Set<number>
          deliveries: Set<number>
          revenue: number
          deliveredRevenue: number
        }
      >()

      const ensure = (ym: string) => {
        if (!result.has(ym))
          result.set(ym, {
            orders: new Set(),
            deliveries: new Set(),
            revenue: 0,
            deliveredRevenue: 0,
          })
        return result.get(ym)!
      }

      //
      // Revenue grouped by order_date
      //

      const orderDateMap = new Map<number, string>()

      for (const o of orders) {
        const ym = `${o.order_date.getFullYear()}-${String(
          o.order_date.getMonth() + 1,
        ).padStart(2, '0')}`

        orderDateMap.set(o.id, ym)

        ensure(ym).orders.add(o.id)
      }

      for (const item of [...orderItems, ...customOrderItems]) {
        const ym = orderDateMap.get(item.order_id)
        if (!ym) continue

        const converted = convertToBaseCurrency(
          item.quantity * item.unit_price,
          item.currency,
          preferredCurrency,
          rates,
        )

        ensure(ym).revenue += converted
      }

      //
      // Delivered revenue grouped by delivery_date
      //

      for (const d of deliveries) {
        if (!d.delivery_date) continue

        const ym = `${d.delivery_date.getFullYear()}-${String(
          d.delivery_date.getMonth() + 1,
        ).padStart(2, '0')}`

        ensure(ym).deliveries.add(d.delivery_id)

        const unitPrice = d.standard_price ?? d.custom_price ?? 0
        const currency = d.standard_currency ?? d.custom_currency ?? 'TRY'
        const signedQuantity =
          d.kind === 'RETURN' ? -d.delivered_quantity : d.delivered_quantity

        const converted = convertToBaseCurrency(
          signedQuantity * unitPrice,
          currency,
          preferredCurrency,
          rates,
        )

        ensure(ym).deliveredRevenue += converted
      }

      //
      // STEP 5 — FINAL OUTPUT
      //

      return months.map(({ yearMonth, monthIndex }) => {
        const m = result.get(yearMonth)

        return {
          monthIndex,
          orders: m?.orders.size ?? 0,
          deliveries: m?.deliveries.size ?? 0,
          revenue: m?.revenue ?? 0,
          deliveredRevenue: m?.deliveredRevenue ?? 0,
        }
      })
    } catch (error) {
      console.error('[getMonthlyOverview] failed:', error)
      fail('OVERVIEW_FETCH_FAILED')
    }
  })
