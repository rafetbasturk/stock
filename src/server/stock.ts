import { createServerFn } from '@tanstack/react-start'
import { and, eq, ilike, or, sql } from 'drizzle-orm'
import {
  createStockMovementTx,
  createStockTransferTx,
  deleteStockMovementTx,
  updateStockMovementTx,
} from './services/stockService'
import { requireAuth } from './auth/requireAuth'
import type { SQL } from 'drizzle-orm'
import type { InsertStockMovement } from '@/types'
import { db } from '@/db'
import { stockMovementsTable } from '@/db/schema'
import { BaseAppError } from '@/lib/error/core'
import { fail } from '@/lib/error/core/serverError'
import { stockSearchSchema } from '@/lib/types/types.search'

type CreateStockMovementInput = Omit<
  InsertStockMovement,
  'created_by' | 'id' | 'created_at' | 'updated_at' | 'deleted_at'
>

export const createStockMovement = createServerFn()
  .inputValidator((data: CreateStockMovementInput) => data)
  .handler(async ({ data }) => {
    const user = await requireAuth()

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

export const createStockTransfer = createServerFn()
  .inputValidator(
    (data: {
      from_product_id: number
      to_product_id: number
      quantity: number
      notes?: string | null
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireAuth()

    try {
      await db.transaction(async (tx) => {
        await createStockTransferTx(tx, {
          ...data,
          created_by: user.id,
        })
      })

      return { success: true }
    } catch (error) {
      console.error('[createStockTransfer]', error)

      if (error instanceof BaseAppError) throw error

      fail('STOCK_MOVEMENT_FAILED')
    }
  })

export const getStockMovements = createServerFn()
  .inputValidator((data) => stockSearchSchema.parse(data))
  .handler(async ({ data }) => {
    const { pageIndex, pageSize, q, movementType, productId } = data

    const conditions: Array<SQL> = []

    if (productId) {
      conditions.push(eq(stockMovementsTable.product_id, productId))
    }

    if (q) {
      const like = `%${q}%`
      conditions.push(
        or(
          ilike(stockMovementsTable.notes, like),
          sql`CAST(${stockMovementsTable.reference_type} AS TEXT) ILIKE ${like}`,
          sql`CAST(${stockMovementsTable.reference_id} AS TEXT) ILIKE ${like}`,
          sql`CAST(${stockMovementsTable.movement_type} AS TEXT) ILIKE ${like}`,
          sql`EXISTS (
            SELECT 1
            FROM "products" p
            WHERE p.id = ${stockMovementsTable.product_id}
            AND (
              p.code ILIKE ${like}
              OR p.name ILIKE ${like}
            )
          )`,
          sql`EXISTS (
            SELECT 1
            FROM "users" u
            WHERE u.id = ${stockMovementsTable.created_by}
            AND u.username ILIKE ${like}
          )`,
        )!,
      )
    }

    if (movementType) {
      const values = movementType
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)

      if (values.length > 1) {
        conditions.push(
          or(
            ...values.map(
              (value) =>
                sql`CAST(${stockMovementsTable.movement_type} AS TEXT) = ${value}`,
            ),
          )!,
        )
      } else if (values.length === 1) {
        conditions.push(
          sql`CAST(${stockMovementsTable.movement_type} AS TEXT) = ${values[0]}`,
        )
      }
    }

    const where = conditions.length ? and(...conditions) : undefined

    const [rows, totalResult, summaryResult] = await Promise.all([
      db.query.stockMovementsTable.findMany({
        where,
        with: {
          product: {
            columns: {
              code: true,
              name: true,
              deleted_at: true,
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
        offset: pageIndex * pageSize,
      }),

      db
        .select({ count: sql<number>`count(*)` })
        .from(stockMovementsTable)
        .where(where),
      db
        .select({
          inCount: sql<number>`count(*) filter (where ${stockMovementsTable.quantity} > 0)`,
          outCount: sql<number>`count(*) filter (where ${stockMovementsTable.quantity} < 0)`,
        })
        .from(stockMovementsTable)
        .where(where),
    ])

    const total = totalResult[0]?.count ?? 0
    const inCount = summaryResult[0]?.inCount ?? 0
    const outCount = summaryResult[0]?.outCount ?? 0

    return {
      data: rows,
      total,
      inCount,
      outCount,
      pageIndex,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    }
  })

export const deleteStockMovement = createServerFn()
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

export const updateStockMovement = createServerFn()
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
