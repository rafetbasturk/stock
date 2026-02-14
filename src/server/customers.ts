// src/server/customers.ts
import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from './middleware/auth'
import { and, eq, ilike, or, SQL, sql } from 'drizzle-orm'
import z from 'zod'
import type { InsertCustomer } from '@/types'
import { db } from '@/db'
import { customersTable } from '@/db/schema'
import { customerSortFields } from '@/lib/types'
import { fail, failValidation } from '@/lib/error/core/serverError'
import { normalizeParams, notDeleted } from './utils'

export const getCustomers = createServerFn().middleware([authMiddleware]).handler(async () => {

  return await db.query.customersTable.findMany()
})

export const getCustomerById = createServerFn().middleware([authMiddleware])
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {

    return db.query.customersTable.findFirst({
      where: (p, { eq: eqFn }) => eqFn(p.id, data.id),
    })
  })

const paginatedSchema = z.object({
  pageIndex: z.number().int().min(0),
  pageSize: z.number().int().min(10).max(100),
  q: z.string().trim().min(1).optional(),
  sortBy: z.enum(customerSortFields).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

export const getPaginatedCustomers = createServerFn().middleware([authMiddleware])
  .inputValidator((data) => paginatedSchema.parse(data))
  .handler(async ({ data }) => {

    const { pageIndex, pageSize, q, sortBy = 'code', sortDir = 'asc' } = data

    const safePageIndex = Math.max(0, pageIndex)
    const safePageSize = Math.min(Math.max(10, pageSize), 100)

    const normalizedQ = normalizeParams(q)

    const conditions: SQL[] = [notDeleted(customersTable)]

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

export const createCustomer = createServerFn().middleware([authMiddleware])
  .inputValidator((data: InsertCustomer) => data)
  .handler(async ({ data: customer }) => {

    const fieldErrors: Record<string, { i18n: { ns: 'validation'; key: 'required' } }> = {}

    if (!customer.code.trim()) {
      fieldErrors.code = { i18n: { ns: 'validation', key: 'required' } }
    }
    if (!customer.name.trim()) {
      fieldErrors.name = { i18n: { ns: 'validation', key: 'required' } }
    }

    if (Object.keys(fieldErrors).length > 0) {
      failValidation(fieldErrors)
    }

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

export const updateCustomer = createServerFn().middleware([authMiddleware])
  .inputValidator((data: { id: number; data: InsertCustomer }) => data)
  .handler(async ({ data: { id, data: customer } }) => {

    if (!Number.isInteger(id) || id <= 0) {
      fail('INVALID_ID')
    }

    const fieldErrors: Record<string, { i18n: { ns: 'validation'; key: 'required' } }> = {}

    if (!customer.code.trim()) {
      fieldErrors.code = { i18n: { ns: 'validation', key: 'required' } }
    }
    if (!customer.name.trim()) {
      fieldErrors.name = { i18n: { ns: 'validation', key: 'required' } }
    }

    if (Object.keys(fieldErrors).length > 0) {
      failValidation(fieldErrors)
    }

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

export const removeCustomer = createServerFn().middleware([authMiddleware])
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data: { id } }) => {

    await db
      .update(customersTable)
      .set({
        deleted_at: sql`now()`,
        updated_at: sql`now()`,
      })
      .where(eq(customersTable.id, id))
    return { success: true }
  })
