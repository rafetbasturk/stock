import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from './middleware/auth'
import { and, eq, inArray, sql } from 'drizzle-orm'
import {
  createStockMovementTx,
  deleteStockMovementTx,
  updateStockMovementTx,
} from './services/stockService'
import type { SQL } from 'drizzle-orm'
import type { InsertStockMovement } from '@/types'
import { db } from '@/db'
import { stockMovementsTable } from '@/db/schema'
import { BaseAppError } from '@/lib/error/core'
import { fail } from '@/lib/error/core/serverError'

export const createStockMovement = createServerFn().middleware([authMiddleware])
  .inputValidator((data: InsertStockMovement) => data)
  .handler(async ({ data, context }) => {
    const user = context.user

    try {
      await db.transaction(async (tx) => {
        await createStockMovementTx(tx, {
          ...data,
          created_by: user.id,
        })
      })

      return { success: true }
    } catch (error) {
      console.error('[createStockMovement]', error)

      if (error instanceof BaseAppError) throw error

      fail('STOCK_MOVEMENT_FAILED')
    }
  })

export const getStockMovements = createServerFn().middleware([authMiddleware])
  .inputValidator(
    (data: {
      product_id?: number
      page?: number
      pageSize?: number
      q?: string
      movementType?: string
    }) => data,
  )
  .handler(async ({ data }) => {

    const page = data.page ?? 0
    const pageSize = data.pageSize ?? 20
    const search = data.q?.trim()
    const movementType = data.movementType?.trim()

    const conditions: Array<SQL> = []

    if (data.product_id) {
      conditions.push(eq(stockMovementsTable.product_id, data.product_id))
    }

    if (search) {
      const like = `%${search}%`
      conditions.push(
        sql`(
          ${stockMovementsTable.notes} ILIKE ${like}
          OR CAST(${stockMovementsTable.reference_type} AS TEXT) ILIKE ${like}
          OR CAST(${stockMovementsTable.reference_id} AS TEXT) ILIKE ${like}
        )`,
      )
    }

    if (movementType) {
      const values = movementType
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)

      if (values.length > 1) {
        conditions.push(
          inArray(stockMovementsTable.movement_type, values as any),
        )
      } else if (values.length === 1) {
        conditions.push(eq(stockMovementsTable.movement_type, values[0] as any))
      }
    }

    const where = conditions.length ? and(...conditions) : undefined

    const [rows, totalResult] = await Promise.all([
      db.query.stockMovementsTable.findMany({
        where,
        with: {
          product: {
            columns: {
              code: true,
              name: true,
            },
          },
          createdBy: {
            columns: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: (m, { desc }) => [desc(m.created_at)],
        limit: pageSize,
        offset: page * pageSize,
      }),

      db
        .select({ count: sql<number>`count(*)` })
        .from(stockMovementsTable)
        .where(where),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: rows,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    }
  })

export const deleteStockMovement = createServerFn().middleware([authMiddleware])
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {

    try {
      await db.transaction(async (tx) => {
        await deleteStockMovementTx(tx, data.id)
      })
      return { success: true }
    } catch (error) {
      console.error('[deleteStockMovement]', error)
      if (error instanceof BaseAppError) throw error
      fail('STOCK_MOVEMENT_DELETE_FAILED')
    }
  })

export const updateStockMovement = createServerFn().middleware([authMiddleware])
  .inputValidator(
    (data: { id: number; quantity?: number; notes?: string }) => data,
  )
  .handler(async ({ data }) => {

    try {
      await db.transaction(async (tx) => {
        const { id, ...updateData } = data
        await updateStockMovementTx(tx, id, updateData)
      })
      return { success: true }
    } catch (error) {
      console.error('[updateStockMovement]', error)
      if (error instanceof BaseAppError) throw error
      fail('STOCK_MOVEMENT_UPDATE_FAILED')
    }
  })
