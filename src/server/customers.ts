// src/server/customers.ts
import { createServerFn } from '@tanstack/react-start'
import { and, eq, ilike, or, sql } from 'drizzle-orm'
import z from 'zod'
import type { InsertCustomer } from '@/types'
import { db } from '@/db'
import { customersTable } from '@/db/schema'
import { customerSortFields } from '@/lib/types'
import { BaseAppError } from '@/lib/error/core'

export const getCustomers = createServerFn().handler(async () => {
  return await db.query.customersTable.findMany()
})

export const getCustomerById = createServerFn({ method: 'GET' })
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

export const getPaginatedCustomers = createServerFn({ method: 'POST' })
  .inputValidator((data) => paginatedSchema.parse(data))
  .handler(async ({ data }) => {
    const { pageIndex, pageSize, q, sortBy = 'code', sortDir = 'asc' } = data

    const conditions = []

    if (q) {
      conditions.push(
        or(
          ilike(customersTable.name, `%${q}%`),
          ilike(customersTable.code, `%${q}%`),
          ilike(customersTable.email, `%${q}%`),
          ilike(customersTable.address, `%${q}%`),
          ilike(customersTable.phone, `%${q}%`),
        ),
      )
    }

    const whereExpr = conditions.length ? and(...conditions) : undefined

    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customersTable)

    if (whereExpr) totalQuery.where(whereExpr)

    const totalResult = await totalQuery
    const total = totalResult[0]?.count ?? 0

    const customers = await db.query.customersTable.findMany({
      ...(whereExpr && { where: () => whereExpr }),
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
    })

    return { data: customers, pageIndex, pageSize, total }
  })

export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((data: InsertCustomer) => data)
  .handler(async ({ data: customer }) => {
    if (!customer.code.trim() || !customer.name.trim()) {
      throw BaseAppError.create({
        status: 400,
        code: 'VALIDATION_ERROR',
      })
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

export const updateCustomer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number; data: InsertCustomer }) => data)
  .handler(async ({ data: { id, data: customer } }) => {
    if (!Number.isInteger(id) || id <= 0) {
      throw BaseAppError.create({
        status: 400,
        code: 'INVALID_ID',
      })
    }

    if (!customer.code.trim() || !customer.name.trim()) {
      throw BaseAppError.create({
        status: 400,
        code: 'VALIDATION_ERROR',
      })
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
      throw BaseAppError.create({
        code: 'CUSTOMER_NOT_FOUND',
        status: 404,
      })
    }

    return updatedCustomers[0]
  })

export const removeCustomer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data: { id } }) => {
    await db.delete(customersTable).where(eq(customersTable.id, id))
    return { success: true }
  })
