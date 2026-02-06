// src/server/orders.ts
import { db } from '@/db'
import { ordersTable } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'

export const getYearRange = createServerFn().handler(async () => {
  const result = await db
    .select({
      minYear: sql<number>`MIN(EXTRACT(YEAR FROM ${ordersTable.order_date}))`,
      maxYear: sql<number>`MAX(EXTRACT(YEAR FROM ${ordersTable.order_date}))`,
    })
    .from(ordersTable)

  const { minYear, maxYear } = result[0] ?? {}
  const currentYear = new Date().getFullYear() // local year

  return {
    minYear: minYear ?? currentYear,
    maxYear: maxYear ?? currentYear,
  }
})
