// src/server/customers.ts
import { createServerFn } from '@tanstack/react-start'
import { and, eq, ilike, or, sql } from 'drizzle-orm'
import { normalizeParams, notDeleted, validateCustomerInput } from './utils'
import type { SQL } from 'drizzle-orm'
import type { InsertCustomer } from '@/types'
import { db } from '@/db'
import { customersTable, ordersTable } from '@/db/schema'
import { fail } from '@/lib/error/core/serverError'
import { customersSearchSchema } from '@/lib/types/types.search'

export const getAllCustomers = createServerFn().handler(async () => {
  return await db.query.customersTable.findMany({
    where: notDeleted(customersTable),
    limit: 1000,
  })
})

export const getCustomerById = createServerFn()
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    return db.query.customersTable.findFirst({
      where: (p, { eq: eqFn }) => eqFn(p.id, data.id),
    })
  })

export const getPaginatedCustomers = createServerFn()
  .inputValidator((data) => customersSearchSchema.parse(data))
  .handler(async ({ data }) => {
    const { pageIndex, pageSize, q, sortBy = 'code', sortDir = 'asc' } = data

    const safePageIndex = Math.max(0, pageIndex)
    const safePageSize = Math.min(Math.max(10, pageSize), 100)

    const normalizedQ = normalizeParams(q)

    const conditions: Array<SQL> = [notDeleted(customersTable)]

    if (normalizedQ) {
      const search = `%${normalizedQ}%`

      conditions.push(
        or(
          ilike(customersTable.name, search),
          ilike(customersTable.code, search),
          ilike(customersTable.email, search),
          ilike(customersTable.address, search),
          ilike(customersTable.phone, search),
        )!,
      )
    }

    const whereExpr: SQL =
      conditions.length === 1 ? conditions[0] : and(...conditions)!

    const [totalResult, customers] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(customersTable)
        .where(whereExpr),
      db.query.customersTable.findMany({
        where: () => whereExpr,
        limit: pageSize,
        offset: pageIndex * pageSize,
        orderBy: (c, { asc, desc }) => {
          const dir = sortDir === 'desc' ? desc : asc

          switch (sortBy) {
            case 'code':
              return [dir(c.code)]
            case 'name':
              return [dir(c.name)]
            case 'email':
              return [dir(c.email)]
            case 'address':
              return [dir(c.address)]
            case 'phone':
              return [dir(c.phone)]
            default:
              return [dir(c.code)]
          }
        },
      }),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: customers,
      pageIndex: safePageIndex,
      pageSize: safePageSize,
      total,
      pageCount: Math.ceil(total / safePageSize),
    }
  })

export const createCustomer = createServerFn()
  .inputValidator((data: InsertCustomer) => data)
  .handler(async ({ data: customer }) => {
    validateCustomerInput(customer)

    const [newCustomer] = await db
      .insert(customersTable)
      .values({
        ...customer,
        code: customer.code.trim(),
        name: customer.name.trim(),
        email: customer.email ? customer.email.trim() : null,
        phone: customer.phone ? customer.phone.trim() : null,
        address: customer.address ? customer.address.trim() : null,
      })
      .returning()

    return newCustomer
  })

export const updateCustomer = createServerFn()
  .inputValidator((data: { id: number; data: InsertCustomer }) => data)
  .handler(async ({ data: { id, data: customer } }) => {
    if (!Number.isInteger(id) || id <= 0) {
      fail('INVALID_ID')
    }

    validateCustomerInput(customer)

    const updatedCustomers = await db
      .update(customersTable)
      .set({
        ...customer,
        code: customer.code.trim(),
        name: customer.name.trim(),
        email: customer.email ? customer.email.trim() : null,
        phone: customer.phone ? customer.phone.trim() : null,
        address: customer.address ? customer.address.trim() : null,
        updated_at: sql`now()`,
      })
      .where(eq(customersTable.id, id))
      .returning()

    if (updatedCustomers.length === 0) {
      fail('CUSTOMER_NOT_FOUND')
    }

    return updatedCustomers[0]
  })

export const removeCustomer = createServerFn()
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data: { id } }) => {
    // Check for active orders before deleting
    const activeOrder = await db.query.ordersTable.findFirst({
      where: and(eq(ordersTable.customer_id, id), notDeleted(ordersTable)),
    })

    if (activeOrder) {
      fail('CUSTOMER_HAS_ACTIVE_ORDERS')
    }

    await db
      .update(customersTable)
      .set({
        deleted_at: sql`now()`,
        updated_at: sql`now()`,
      })
      .where(eq(customersTable.id, id))
    return { success: true }
  })

export const getDistinctCustomers = createServerFn().handler(async () => {
  const customerRows = await db
    .selectDistinct({
      customer_id: ordersTable.customer_id,
      customer_name: customersTable.name,
      customer_code: customersTable.code,
    })
    .from(ordersTable)
    .where(notDeleted(ordersTable))
    .innerJoin(customersTable, eq(customersTable.id, ordersTable.customer_id))

  const customers = customerRows
    .map((row) => ({
      id: row.customer_id,
      name: row.customer_name.trim(),
      code: row.customer_code.trim(),
    }))
    .filter((row) => row.name.length > 0)
    .sort((a, b) => a.code.localeCompare(b.code, 'tr', { sensitivity: 'base' }))

  return customers
})
