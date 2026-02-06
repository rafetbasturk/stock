// src/server/products.ts
import { db } from '@/db'
import { customersTable, productsTable } from '@/db/schema'
import { productSortFields } from '@/lib/types/types.search'
import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, ilike, or, sql } from 'drizzle-orm'
import z from 'zod'
import type { InsertProduct } from '@/types'
import { editProductBeforeInsert, validateProduct } from './utils'
import { BaseAppError } from '@/lib/error/core'
import { orderItemsTable, ordersTable } from '@/db/schema'

export const getProducts = createServerFn().handler(async () => {
  return await db.query.productsTable.findMany({
    columns: {
      id: true,
      code: true,
      name: true,
      price: true,
      currency: true,
    },
  })
})

export const getProductById = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    return db.query.productsTable.findFirst({
      with: { customer: true },
      where: (p, { eq }) => eq(p.id, data.id),
    })
  })

const paginatedSchema = z.object({
  pageIndex: z.number().int().min(0),
  pageSize: z.number().int().min(10).max(100),
  q: z.string().trim().min(1).optional(),
  material: z.array(z.string()).optional(),
  customer: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(productSortFields).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

export const getPaginated = createServerFn({ method: 'POST' })
  .inputValidator((data) => paginatedSchema.parse(data))
  .handler(async ({ data }) => {
    const {
      pageIndex,
      pageSize,
      q,
      material,
      customer,
      sortBy = 'code',
      sortDir = 'asc',
    } = data

    const conditions = []

    if (q) {
      conditions.push(
        or(
          ilike(productsTable.name, `%${q}%`),
          ilike(productsTable.code, `%${q}%`),
          ilike(productsTable.other_codes, `%${q}%`),
          ilike(productsTable.notes, `%${q}%`),
          ilike(productsTable.material, `%${q}%`),
          ilike(productsTable.coating, `%${q}%`),
        ),
      )
    }

    if (material?.length) {
      conditions.push(
        or(...material.map((m) => ilike(productsTable.material, `%${m}%`))),
      )
    }

    if (customer != null) {
      conditions.push(eq(productsTable.customer_id, customer))
    }

    const whereExpr = conditions.length ? and(...conditions) : undefined

    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(productsTable)

    if (whereExpr) totalQuery.where(whereExpr)

    const totalResult = await totalQuery
    const total = totalResult[0]?.count ?? 0

    const products = await db.query.productsTable.findMany({
      with: { customer: true },
      ...(whereExpr && { where: () => whereExpr }),
      limit: pageSize,
      offset: pageIndex * pageSize,
      orderBy: (p, { asc, desc }) => {
        const dir = sortDir === 'desc' ? desc : asc

        switch (sortBy) {
          case 'code':
            return [dir(p.code)]
          case 'name':
            return [dir(p.name)]
          case 'price':
            return [dir(p.price)]
          case 'other_codes':
            return [dir(p.other_codes)]
          case 'material':
            return [dir(p.material)]
          case 'post_process':
            return [dir(p.post_process)]
          case 'coating':
            return [dir(p.coating)]
          default:
            return [dir(p.code)]
        }
      },
    })

    return { data: products, pageIndex, pageSize, total }
  })

export const getProductFilterOptions = createServerFn({
  method: 'GET',
}).handler(async () => {
  const rows = await db
    .selectDistinct({ material: productsTable.material })
    .from(productsTable)

  const customerRows = await db
    .selectDistinct({
      id: customersTable.id,
      name: customersTable.name,
    })
    .from(productsTable)
    .innerJoin(customersTable, eq(productsTable.customer_id, customersTable.id))

  const materials = rows
    .map((r) => (r.material ?? '').trim())
    .filter((m): m is string => m.length > 0)

  // Optional but nice: stable, user-friendly ordering
  materials.sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' }))

  const customers = customerRows
    .map((row) => ({
      id: row.id,
      name: row.name.trim(),
    }))
    .filter((row) => row.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }))

  return { materials, customers }
})

export const createProduct = createServerFn({ method: 'POST' })
  .inputValidator((data: InsertProduct) => data)
  .handler(async ({ data: product }) => {
    validateProduct(product)
    editProductBeforeInsert(product)

    const [newProduct] = await db
      .insert(productsTable)
      .values(product)
      .returning()

    return newProduct
  })

export const updateProduct = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number; data: InsertProduct }) => data)
  .handler(async ({ data: { id, data: product } }) => {
    validateProduct(product)
    editProductBeforeInsert(product)

    const result = await db.transaction(async (tx) => {
      // Update the product
      const updateResult = await tx
        .update(productsTable)
        .set({
          ...product,
          updated_at: sql`now()`,
        })
        .where(eq(productsTable.id, id))
        .returning()

      if (!updateResult || updateResult.length === 0) {
        throw BaseAppError.create({
          code: 'PRODUCT_NOT_FOUND',
          status: 404,
        })
      }

      // Find open orders with this product
      const openOrdersWithProduct = await tx
        .select({
          order_id: ordersTable.id,
          order_number: ordersTable.order_number,
        })
        .from(ordersTable)
        .innerJoin(
          orderItemsTable,
          eq(ordersTable.id, orderItemsTable.order_id),
        )
        .where(
          and(
            eq(orderItemsTable.product_id, id),
            eq(ordersTable.status, 'KAYIT'),
          ),
        )
        .groupBy(ordersTable.id)

      // Update order status if needed
      if (openOrdersWithProduct.length > 0) {
        const orderIds = openOrdersWithProduct.map((order) => order.order_id)
        await tx
          .update(ordersTable)
          .set({
            status: 'HAZIR',
            updated_at: sql`now()`,
          })
          .where(inArray(ordersTable.id, orderIds))
      }

      return updateResult[0]
    })

    return result
  })

export const removeProduct = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data: { id } }) => {
    await db.delete(productsTable).where(eq(productsTable.id, id))
    return { success: true }
  })
