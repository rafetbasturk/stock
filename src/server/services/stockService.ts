import { and, eq, sql } from 'drizzle-orm'
import { InsertStockMovement } from '@/types'
import { productsTable, stockMovementsTable } from '@/db/schema'
import { fail } from '@/lib/error/core/serverError'
import type { PgTransaction } from 'drizzle-orm/pg-core'

export async function createStockMovementTx(
  tx: PgTransaction<any, any, any>,
  input: InsertStockMovement,
) {
  if (input.quantity === 0)
    fail('INVALID_STOCK_QUANTITY')

  if (
    (input.reference_type && !input.reference_id) ||
    (!input.reference_type && input.reference_id)
  )
    fail('INVALID_REFERENCE')

  const product = await tx
    .select({
      id: productsTable.id,
      stock_quantity: productsTable.stock_quantity,
    })
    .from(productsTable)
    .where(
      and(
        eq(productsTable.id, input.product_id),
        sql`${productsTable.deleted_at} IS NULL`,
      ),
    )
    .for('update')
    .then((rows) => rows[0])

  if (!product)
    fail('PRODUCT_NOT_FOUND')

  if (input.quantity < 0) {
    const newStock = product.stock_quantity + input.quantity

    if (newStock < 0)
      fail('INSUFFICIENT_STOCK')
  }

  await tx.insert(stockMovementsTable).values(input).returning()

  await tx
    .update(productsTable)
    .set({
      stock_quantity: sql`${productsTable.stock_quantity} + ${input.quantity}`,
      updated_at: sql`now()`,
    })
    .where(eq(productsTable.id, input.product_id))
}

export async function deleteStockMovementTx(
  tx: PgTransaction<any, any, any>,
  id: number,
) {
  const movement = await tx
    .select()
    .from(stockMovementsTable)
    .where(eq(stockMovementsTable.id, id))
    .for('update')
    .then((rows) => rows[0])

  if (!movement)
    fail('STOCK_MOVEMENT_NOT_FOUND')

  if (movement.reference_type && movement.reference_type !== 'adjustment') {
    fail('RESTRICTED_STOCK_MOVEMENT')
  }

  // Revert stock quantity
  await tx
    .update(productsTable)
    .set({
      stock_quantity: sql`${productsTable.stock_quantity} - ${movement.quantity}`,
      updated_at: sql`now()`,
    })
    .where(eq(productsTable.id, movement.product_id))

  await tx.delete(stockMovementsTable).where(eq(stockMovementsTable.id, id))
}

export async function updateStockMovementTx(
  tx: PgTransaction<any, any, any>,
  id: number,
  input: { quantity?: number; notes?: string },
) {
  const movement = await tx
    .select()
    .from(stockMovementsTable)
    .where(eq(stockMovementsTable.id, id))
    .for('update')
    .then((rows) => rows[0])

  if (!movement)
    fail('STOCK_MOVEMENT_NOT_FOUND')

  if (movement.reference_type && movement.reference_type !== 'adjustment') {
    fail('RESTRICTED_STOCK_MOVEMENT')
  }

  if (input.quantity !== undefined && input.quantity !== movement.quantity) {
    if (input.quantity === 0)
      fail('INVALID_STOCK_QUANTITY')

    // Update product stock with the difference
    const diff = input.quantity - movement.quantity
    await tx
      .update(productsTable)
      .set({
        stock_quantity: sql`${productsTable.stock_quantity} + ${diff}`,
        updated_at: sql`now()`,
      })
      .where(eq(productsTable.id, movement.product_id))
  }

  await tx
    .update(stockMovementsTable)
    .set({
      ...input,
      updated_at: sql`now()`,
    })
    .where(eq(stockMovementsTable.id, id))
}
