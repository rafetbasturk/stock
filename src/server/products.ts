// src/server/products.ts
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import {
  editProductBeforeInsert,
  normalizeParams,
  notDeleted,
  recalculateOrderReadyStatus,
  validateProduct,
} from './utils'
import { requireAuth } from './auth/requireAuth'
import { createStockMovementTx } from './services/stockService'
import type { SQL } from 'drizzle-orm'
import type { InsertProduct } from '@/types'
import { fail, throwTransportError } from '@/lib/error/core/serverError'
import { db } from '@/db'
import {
  customersTable,
  orderItemsTable,
  ordersTable,
  productsTable,
} from '@/db/schema'
import { productsSearchSchema } from '@/lib/types/types.search'

export const getProducts = createServerFn().handler(async () => {
  return await db.query.productsTable.findMany({
    where: notDeleted(productsTable),
    columns: {
      id: true,
      code: true,
      name: true,
      price: true,
      currency: true,
      stock_quantity: true,
    },
  })
})

export const getProductById = createServerFn()
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const product = await db.query.productsTable.findFirst({
      with: {
        customer: true,
        stockMovements: {
          orderBy: (m, { desc }) => [desc(m.created_at)],
          limit: 100,
        },
      },
      where: (p, { eq: eqFn, and: andFn }) =>
        andFn(eqFn(p.id, data.id), notDeleted(p)),
    })

    if (!product) throw notFound()
    // fail('PRODUCT_NOT_FOUND')

    return product
  })

export const getPaginated = createServerFn()
  .inputValidator((data) => productsSearchSchema.parse(data))
  .handler(async ({ data }) => {
    const {
      pageIndex,
      pageSize,
      q,
      material,
      customerId,
      sortBy = 'code',
      sortDir = 'asc',
    } = data

    const safePageIndex = Math.max(0, pageIndex)
    const safePageSize = Math.min(Math.max(10, pageSize), 100)

    const normalizedQ = normalizeParams(q)
    const normalizedMaterial = normalizeParams(material)
    const normalizedCustomerId = normalizeParams(customerId)

    const conditions: Array<SQL> = [notDeleted(productsTable)]

    // Search filter
    if (normalizedQ) {
      const search = `%${normalizedQ}%`
      conditions.push(
        or(
          ilike(productsTable.code, search),
          ilike(productsTable.name, search),
          ilike(productsTable.material, search),
          ilike(productsTable.other_codes, search),
          ilike(productsTable.notes, search),
          ilike(productsTable.coating, search),
        )!,
      )
    }

    // Material filter
    if (normalizedMaterial) {
      const values = normalizedMaterial.split(',').filter(Boolean)

      if (values.length > 1)
        conditions.push(inArray(productsTable.material, values as any))
      else conditions.push(eq(productsTable.material, values[0] as any))
    }

    // Customer filter
    if (normalizedCustomerId) {
      const ids = normalizedCustomerId
        .split('|')
        .map(Number)
        .filter((n) => Number.isInteger(n))

      if (ids.length > 1)
        conditions.push(inArray(productsTable.customer_id, ids))
      else if (ids.length === 1)
        conditions.push(eq(productsTable.customer_id, ids[0]))
    }

    const whereExpr =
      conditions.length === 1 ? conditions[0] : and(...conditions)!

    const rankingExpr = normalizedQ
      ? sql<number>`
        (
          CASE
            WHEN ${productsTable.code} = ${q} THEN 1000
            ELSE 0
          END

          +

          CASE
            WHEN ${productsTable.code} ILIKE ${q + '%'} THEN 200
            ELSE 0
          END

          +

          similarity(${productsTable.code}, ${q}) * 50 +
          similarity(${productsTable.name}, ${q}) * 30 +
          similarity(${productsTable.material}, ${q}) * 20 +
          similarity(${productsTable.other_codes}, ${q}) * 10 +
          similarity(${productsTable.notes}, ${q}) * 5
        )
      `
      : undefined

    const [totalResult, products] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(productsTable)
        .where(whereExpr),

      db.query.productsTable.findMany({
        with: { customer: true },
        where: () => whereExpr,
        limit: safePageSize,
        offset: safePageIndex * safePageSize,

        orderBy: (p, { asc, desc }) => {
          // Use intelligent ranking when searching
          if (normalizedQ && rankingExpr) {
            return [desc(rankingExpr), asc(p.code), asc(p.id)]
          }

          // Otherwise use manual sorting
          const dir = sortDir === 'desc' ? desc : asc

          switch (sortBy) {
            case 'code':
              return [dir(p.code), asc(p.id)]

            case 'name':
              return [dir(p.name), asc(p.id)]

            case 'price':
              return [dir(p.price), asc(p.id)]

            case 'other_codes':
              return [dir(p.other_codes), asc(p.id)]

            case 'material':
              return [dir(p.material), asc(p.id)]

            case 'post_process':
              return [dir(p.post_process), asc(p.id)]

            case 'coating':
              return [dir(p.coating), asc(p.id)]

            default:
              return [dir(p.code), asc(p.id)]
          }
        },
      }),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: products,
      pageIndex: safePageIndex,
      pageSize: safePageSize,
      total,
      pageCount: Math.ceil(total / safePageSize),
    }
  })

export const createProduct = createServerFn()
  .inputValidator((data: InsertProduct) => data)
  .handler(async ({ data }) => {
    const user = await requireAuth()

    validateProduct(data)
    editProductBeforeInsert(data)

    return db.transaction(async (tx) => {
      const initialStock = data.stock_quantity ?? 0

      const [newProduct] = await tx
        .insert(productsTable)
        .values({
          ...data,
          stock_quantity: 0,
        })
        .returning()

      if (initialStock > 0) {
        await createStockMovementTx(tx, {
          product_id: newProduct.id,
          quantity: initialStock,
          movement_type: 'IN',
          reference_type: 'adjustment',
          reference_id: newProduct.id,
          created_by: user.id,
          notes: 'Initial stock',
        })
      }

      return newProduct
    })
  })

export const adjustProductStock = createServerFn()
  .inputValidator(
    (data: { product_id: number; quantity: number; notes?: string }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireAuth()

    return db.transaction(async (tx) => {
      const product = await tx.query.productsTable.findFirst({
        where: eq(productsTable.id, data.product_id),
        columns: { stock_quantity: true },
      })

      if (!product) fail('PRODUCT_NOT_FOUND')

      const newStock = product.stock_quantity + data.quantity

      if (newStock < 0) fail('INSUFFICIENT_STOCK')

      await createStockMovementTx(tx, {
        product_id: data.product_id,
        quantity: data.quantity,
        movement_type: 'ADJUSTMENT',
        reference_type: 'adjustment',
        reference_id: data.product_id,
        created_by: user.id,
        notes: data.notes,
      })

      return { success: true }
    })
  })

export const updateProduct = createServerFn()
  .inputValidator(
    (data: {
      id: number
      data: InsertProduct & {
        stockAction?: {
          type: 'IN' | 'OUT'
          quantity: number
          notes?: string
        }
      }
    }) => data,
  )
  .handler(async ({ data: { id, data: product } }) => {
    const user = await requireAuth()

    validateProduct(product)
    editProductBeforeInsert(product)

    const { stock_quantity, stockAction, ...safeProduct } = product

    const result = await db.transaction(async (tx) => {
      // Update the product
      const updateResult = await tx
        .update(productsTable)
        .set({
          ...safeProduct,
          updated_at: sql`now()`,
        })
        .where(eq(productsTable.id, id))
        .returning()

      if (updateResult.length === 0) {
        fail('PRODUCT_NOT_FOUND')
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

      // Update order status if needed (RECALCULATE accurately)
      if (openOrdersWithProduct.length > 0) {
        for (const order of openOrdersWithProduct) {
          await recalculateOrderReadyStatus(tx, order.order_id)
        }
      }

      const stockActionQuantity = Math.trunc(Number(stockAction?.quantity ?? 0))

      if (stockAction && stockActionQuantity > 0) {
        await createStockMovementTx(tx, {
          product_id: id,
          quantity:
            stockAction.type === 'OUT'
              ? -stockActionQuantity
              : stockActionQuantity,
          movement_type: stockAction.type,
          reference_type: 'adjustment',
          reference_id: id,
          created_by: user.id,
          notes: stockAction.notes?.trim() || null,
        })
      }

      return updateResult[0]
    })

    return result
  })

export const removeProduct = createServerFn()
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data: { id } }) => {
    try {
      return await db.transaction(async (tx) => {
        const product = await tx.query.productsTable.findFirst({
          where: eq(productsTable.id, id),
        })

        if (!product) fail('PRODUCT_NOT_FOUND')

        if (product.stock_quantity !== 0) fail('PRODUCT_HAS_STOCK')

        await tx
          .update(productsTable)
          .set({
            deleted_at: sql`now()`,
            updated_at: sql`now()`,
          })
          .where(eq(productsTable.id, id))

        return { success: true }
      })
    } catch (error) {
      throwTransportError(error)
    }
  })

export const getProductFilterOptions = createServerFn().handler(async () => {
  const rows = await db
    .selectDistinct({ material: productsTable.material })
    .from(productsTable)
    .where(notDeleted(productsTable))

  const customerRows = await db
    .selectDistinct({
      id: customersTable.id,
      name: customersTable.name,
    })
    .from(productsTable)
    .where(notDeleted(productsTable))
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
