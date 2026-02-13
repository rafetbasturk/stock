// src/server/metrics.ts
import { db } from '@/db'
import {
  customOrderItemsTable,
  deliveriesTable,
  deliveryItemsTable,
  orderItemsTable,
  ordersTable,
} from '@/db/schema'
import { convertToBaseCurrency, Rate } from '@/lib/currency'
import { AppError } from '@/lib/error/core/AppError'
import { fail } from '@/lib/error/core/serverError'
import { Currency } from '@/types'
import { createServerFn } from '@tanstack/react-start'
import {
  and,
  count,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  ne,
  sql,
  SQL,
} from 'drizzle-orm'
import { notDeleted } from './utils'

export type GetKeyMetricsData = {
  rates: Rate[]
  filters?: { customerId?: number; year?: number }
  preferredCurrency?: Currency
}

export const getKeyMetrics = createServerFn({ method: 'GET' })
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
        .where(inArray(orderItemsTable.order_id, orderIds))

      const customOrderItems = await db
        .select({
          order_id: customOrderItemsTable.order_id,
          quantity: customOrderItemsTable.quantity,
          unit_price: customOrderItemsTable.unit_price,
          currency: customOrderItemsTable.currency,
        })
        .from(customOrderItemsTable)
        .where(inArray(customOrderItemsTable.order_id, orderIds))

      const allItems = [...orderItems, ...customOrderItems]

      // 🔹 3️⃣ Total revenue per order
      const orderRevenueMap = new Map<number, number>()
      for (const item of allItems) {
        try {
          const amount = (item.unit_price ?? 0) * (item.quantity ?? 0)
          const converted = convertToBaseCurrency(
            amount,
            item.currency ?? 'TRY',
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
          throw fail('METRICS_FETCH_FAILED')
        }
      }

      // 🔹 4️⃣ Delivered revenue — join delivery_items with both item tables
      const deliveries = await db
        .select({
          delivered_quantity: deliveryItemsTable.delivered_quantity,
          standard_order_id: orderItemsTable.order_id,
          standard_price: orderItemsTable.unit_price,
          standard_currency: orderItemsTable.currency,
          custom_order_id: customOrderItemsTable.order_id,
          custom_price: customOrderItemsTable.unit_price,
          custom_currency: customOrderItemsTable.currency,
        })
        .from(deliveryItemsTable)
        .leftJoin(
          orderItemsTable,
          eq(deliveryItemsTable.order_item_id, orderItemsTable.id),
        )
        .leftJoin(
          customOrderItemsTable,
          eq(deliveryItemsTable.custom_order_item_id, customOrderItemsTable.id),
        )

      const deliveredMap = new Map<number, number>()

      for (const d of deliveries) {
        const orderId = d.standard_order_id ?? d.custom_order_id
        if (!orderId || !orderIds.includes(orderId)) continue

        const unitPrice = d.standard_price ?? d.custom_price ?? 0
        const currency = d.standard_currency ?? d.custom_currency ?? 'TRY'
        const deliveredAmount = (d.delivered_quantity ?? 0) * unitPrice

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
      const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0
      const maxOrderValue = revenues.length ? Math.max(...revenues) : 0
      const minOrderValue = revenues.length ? Math.min(...revenues) : 0

      const now = new Date()
      const ordersThisMonth = orders.filter((o) => {
        const date = o.order_date as Date // Drizzle "timestamp" => Date
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        )
      }).length

      const pendingOrders = orders.filter(
        (o) => o.status !== 'BİTTİ' && o.status !== 'İPTAL',
      ).length

      return {
        totalOrders,
        totalRevenue,
        deliveredRevenue,
        avgOrderValue,
        maxOrderValue,
        minOrderValue,
        ordersThisMonth,
        pendingOrders,
      }
    } catch (error) {
      console.error('[getKeyMetrics] failed:', error)

      if (error instanceof AppError) {
        throw error // already classified
      }

      throw fail('METRICS_FETCH_FAILED')
    }
  })

export const getOrdersByStatus = createServerFn({ method: 'GET' })
  .inputValidator((data: GetKeyMetricsData['filters']) => data)
  .handler(async ({ data }) => {
    try {
      const whereConditions = [
        notDeleted(ordersTable),
        ne(ordersTable.status, 'İPTAL'),
      ]

      if (data?.customerId)
        whereConditions.push(eq(ordersTable.customer_id, data.customerId))
      if (typeof data?.year === 'number') {
        const start = new Date(data.year, 0, 1)
        const end = new Date(data.year + 1, 0, 1)

        whereConditions.push(gte(ordersTable.order_date, start))
        whereConditions.push(lt(ordersTable.order_date, end))
      }

      const result = await db
        .select({
          name: ordersTable.status,
          value: sql<number>`CAST(${count()} AS INTEGER)`,
        })
        .from(ordersTable)
        .where(and(...whereConditions))
        .groupBy(ordersTable.status)

      if (!Array.isArray(result)) throw fail('ORDERS_STATUS_FETCH_FAILED')

      return result
    } catch (error) {
      if (error instanceof AppError) throw error
      throw fail('ORDERS_STATUS_FETCH_FAILED')
    }
  })

export const getMonthlyOrders = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      filters: GetKeyMetricsData['filters']
      monthCount?: number
      rates: Rate[]
      preferredCurrency: Currency
    }) => data,
  )
  .handler(
    async ({
      data: { filters, monthCount = 12, rates, preferredCurrency },
    }) => {
      try {
        const { customerId, year } = filters ?? {}

        let months: { yearMonth: string; monthIndex: number }[] = []
        let whereConditions: SQL[] = []

        if (typeof year === 'number') {
          // 📆 Selected Year: Jan-Dec
          months = Array.from({ length: 12 }, (_, i) => {
            const monthNum = String(i + 1).padStart(2, '0')
            return {
              yearMonth: `${year}-${monthNum}`,
              monthIndex: i,
            }
          })

          const start = new Date(year, 0, 1)
          const end = new Date(year + 1, 0, 1)

          whereConditions = [
            isNull(ordersTable.deleted_at),
            ne(ordersTable.status, 'İPTAL'),
            gte(ordersTable.order_date, start),
            lt(ordersTable.order_date, end),
          ]
        } else {
          // 📆 Default: Last N months
          const safeMonthCount = Math.max(1, monthCount)
          const now = new Date()

          const start = new Date(
            now.getFullYear(),
            now.getMonth() - (safeMonthCount - 1),
            1,
          )
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

          months = Array.from({ length: safeMonthCount }, (_, i) => {
            const date = new Date(now)
            date.setDate(1)
            date.setMonth(now.getMonth() - (safeMonthCount - 1 - i))

            const yearNum = date.getFullYear()
            const monthNum = String(date.getMonth() + 1).padStart(2, '0')

            return {
              yearMonth: `${yearNum}-${monthNum}`,
              monthIndex: date.getMonth(),
            }
          })

          whereConditions = [
            isNull(ordersTable.deleted_at),
            ne(ordersTable.status, 'İPTAL'),
            gte(ordersTable.order_date, start),
            lt(ordersTable.order_date, end),
          ]
        }

        if (typeof customerId === 'number') {
          whereConditions.push(eq(ordersTable.customer_id, customerId))
        }

        // 🔹 1️⃣ Get relevant orders
        const orders = await db
          .select({
            id: ordersTable.id,
            currency: ordersTable.currency,
            order_date: ordersTable.order_date,
          })
          .from(ordersTable)
          .where(and(...whereConditions))

        if (orders.length === 0) {
          return months.map((m) => ({
            monthIndex: m.monthIndex,
            orders: 0,
            revenue: 0,
          }))
        }

        const orderIds = orders.map((o) => o.id)

        // 🔹 2️⃣ Get order items (standard + custom)
        const orderItems = await db
          .select({
            order_id: orderItemsTable.order_id,
            quantity: orderItemsTable.quantity,
            unit_price: orderItemsTable.unit_price,
            currency: orderItemsTable.currency,
          })
          .from(orderItemsTable)
          .where(inArray(orderItemsTable.order_id, orderIds))

        const customOrderItems = await db
          .select({
            order_id: customOrderItemsTable.order_id,
            quantity: customOrderItemsTable.quantity,
            unit_price: customOrderItemsTable.unit_price,
            currency: customOrderItemsTable.currency,
          })
          .from(customOrderItemsTable)
          .where(inArray(customOrderItemsTable.order_id, orderIds))

        const allItems = [...orderItems, ...customOrderItems]

        // 🔹 3️⃣ Aggregate by month
        const statsMap = new Map<string, { orders: number; revenue: number }>()

        // Initialize statsMap with 0s for all periods
        orders.forEach((o) => {
          const date = o.order_date as Date
          const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          if (!statsMap.has(ym)) {
            statsMap.set(ym, { orders: 0, revenue: 0 })
          }
          statsMap.get(ym)!.orders++
        })

        for (const item of allItems) {
          const order = orders.find((o) => o.id === item.order_id)
          if (order) {
            const date = order.order_date as Date
            const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

            const amount = (item.unit_price ?? 0) * (item.quantity ?? 0)
            const converted = convertToBaseCurrency(
              amount,
              item.currency ?? 'TRY',
              preferredCurrency,
              rates,
            )

            const current = statsMap.get(ym) || { orders: 0, revenue: 0 }
            statsMap.set(ym, {
              ...current,
              revenue: current.revenue + converted,
            })
          }
        }

        // 📊 Grafiğe gidecek data
        const chartData = months.map(({ yearMonth, monthIndex }) => {
          const data = statsMap.get(yearMonth)
          return {
            monthIndex,
            orders: data?.orders ?? 0,
            revenue: data?.revenue ?? 0,
          }
        })

        return chartData
      } catch (error) {
        console.error('[getMonthlyOrders] failed:', error)
        if (error instanceof AppError) throw error
        throw fail('MONTHLY_ORDERS_FETCH_FAILED')
      }
    },
  )
export const getMonthlyDeliveries = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      filters: GetKeyMetricsData['filters']
      monthCount?: number
      rates: Rate[]
      preferredCurrency: Currency
    }) => data,
  )
  .handler(
    async ({
      data: { filters, monthCount = 12, rates, preferredCurrency },
    }) => {
      try {
        const { customerId, year } = filters ?? {}

        let months: { yearMonth: string; monthIndex: number }[] = []
        let whereConditions: SQL[] = []

        if (typeof year === 'number') {
          // 📆 Selected Year: Jan-Dec
          months = Array.from({ length: 12 }, (_, i) => {
            const monthNum = String(i + 1).padStart(2, '0')
            return {
              yearMonth: `${year}-${monthNum}`,
              monthIndex: i,
            }
          })

          whereConditions = [
            isNull(deliveriesTable.deleted_at),
            sql`EXTRACT(YEAR FROM ${deliveriesTable.delivery_date}) = ${year}`,
          ]
        } else {
          // 📆 Default: Last N months
          const safeMonthCount = Math.max(1, monthCount)
          const rangeMonths = Math.max(0, safeMonthCount - 1)
          const now = new Date()

          months = Array.from({ length: safeMonthCount }, (_, i) => {
            const date = new Date(now)
            date.setDate(1)
            date.setMonth(now.getMonth() - (safeMonthCount - 1 - i))

            const yearNum = date.getFullYear()
            const monthNum = String(date.getMonth() + 1).padStart(2, '0')

            return {
              yearMonth: `${yearNum}-${monthNum}`,
              monthIndex: date.getMonth(),
            }
          })

          whereConditions = [
            isNull(deliveriesTable.deleted_at),
            sql`${deliveriesTable.delivery_date} >= DATE_TRUNC('month', CURRENT_DATE) - (${rangeMonths} * INTERVAL '1 month')`,
          ]
        }

        if (typeof customerId === 'number') {
          whereConditions.push(eq(deliveriesTable.customer_id, customerId))
        }

        // 🔹 1️⃣ Get deliveries with items and prices
        const deliveries = await db
          .select({
            id: deliveriesTable.id,
            delivery_date: deliveriesTable.delivery_date,
            delivered_quantity: deliveryItemsTable.delivered_quantity,
            standard_price: orderItemsTable.unit_price,
            standard_currency: orderItemsTable.currency,
            custom_price: customOrderItemsTable.unit_price,
            custom_currency: customOrderItemsTable.currency,
          })
          .from(deliveriesTable)
          .leftJoin(
            deliveryItemsTable,
            eq(deliveryItemsTable.delivery_id, deliveriesTable.id),
          )
          .leftJoin(
            orderItemsTable,
            eq(deliveryItemsTable.order_item_id, orderItemsTable.id),
          )
          .leftJoin(
            customOrderItemsTable,
            eq(
              deliveryItemsTable.custom_order_item_id,
              customOrderItemsTable.id,
            ),
          )
          .where(and(...whereConditions))

        if (deliveries.length === 0) {
          return months.map((m) => ({
            monthIndex: m.monthIndex,
            deliveries: 0,
            revenue: 0,
          }))
        }

        // 🔹 2️⃣ Aggregate by month
        const statsMap = new Map<
          string,
          { deliveries: number; revenue: number }
        >()
        const deliveryCountSet = new Map<string, Set<number>>()

        // Initialize with default months
        months.forEach((m) => {
          statsMap.set(m.yearMonth, { deliveries: 0, revenue: 0 })
          deliveryCountSet.set(m.yearMonth, new Set())
        })

        for (const d of deliveries) {
          const date = d.delivery_date
          const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

          if (!statsMap.has(ym)) continue

          // Unique delivery count per month
          if (d.id) {
            deliveryCountSet.get(ym)?.add(d.id)
          }

          const unitPrice = d.standard_price ?? d.custom_price ?? 0
          const currency = d.standard_currency ?? d.custom_currency ?? 'TRY'
          const amount = (d.delivered_quantity ?? 0) * unitPrice

          const converted = convertToBaseCurrency(
            amount,
            currency,
            preferredCurrency,
            rates,
          )

          const current = statsMap.get(ym)!
          current.revenue += converted
        }

        // Apply distinct counts
        deliveryCountSet.forEach((ids, ym) => {
          if (statsMap.has(ym)) {
            statsMap.get(ym)!.deliveries = ids.size
          }
        })

        const chartData = months.map(({ yearMonth, monthIndex }) => {
          const data = statsMap.get(yearMonth)
          return {
            monthIndex,
            deliveries: data?.deliveries ?? 0,
            revenue: data?.revenue ?? 0,
          }
        })

        return chartData
      } catch (error) {
        console.error('[getMonthlyDeliveries] failed:', error)
        if (error instanceof AppError) throw error
        throw fail('DELIVERIES_FETCH_FAILED')
      }
    },
  )
