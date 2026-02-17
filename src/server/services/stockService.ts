import { and, eq, sql } from 'drizzle-orm'
import { InsertStockMovement } from '@/types'
import { productsTable, stockMovementsTable } from '@/db/schema'
import { fail } from '@/lib/error/core/serverError'
import type { PgTransaction } from 'drizzle-orm/pg-core'

export async function createStockMovementTx(
  tx: PgTransaction<any, any, any>,
  input: InsertStockMovement,
) {
  if (input.quantity === 0) fail('INVALID_STOCK_QUANTITY')

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

  if (!product) fail('PRODUCT_NOT_FOUND')

  if (input.quantity < 0) {
    const newStock = product.stock_quantity + input.quantity

    if (newStock < 0) fail('INSUFFICIENT_STOCK')
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

  if (!movement) fail('STOCK_MOVEMENT_NOT_FOUND')

  if (movement.reference_type && movement.reference_type !== 'adjustment') {
    fail('RESTRICTED_STOCK_MOVEMENT')
  }

  // 1. Lock Product
  await tx
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, movement.product_id))
    .for('update')

  // 2. Revert stock quantity
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

  if (!movement) fail('STOCK_MOVEMENT_NOT_FOUND')

  if (movement.reference_type && movement.reference_type !== 'adjustment') {
    fail('RESTRICTED_STOCK_MOVEMENT')
  }

  if (input.quantity !== undefined && input.quantity !== movement.quantity) {
    if (input.quantity === 0) fail('INVALID_STOCK_QUANTITY')

    // 1. Lock Product
    await tx
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.id, movement.product_id))
      .for('update')

    // 2. Update product stock with the difference
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
export async function internalStockMovementCleanupTx(
  tx: PgTransaction<any, any, any>,
  reference_type: 'delivery' | 'order',
  reference_id: number,
  userId: number,
) {
  const movements = await tx
    .select()
    .from(stockMovementsTable)
    .where(
      and(
        eq(stockMovementsTable.reference_type, reference_type),
        eq(stockMovementsTable.reference_id, reference_id),
      ),
    )
    .for('update')

  for (const movement of movements) {
    // 1. Create reversal movement
    await tx.insert(stockMovementsTable).values({
      product_id: movement.product_id,
      quantity: -movement.quantity, // Reverse the quantity
      movement_type: 'ADJUSTMENT',
      reference_type: movement.reference_type,
      reference_id: movement.reference_id,
      created_by: userId,
      notes: `Reversal of ${movement.movement_type} #${movement.id} (${reference_type} #${reference_id} change/removal)`,
    })

    // 2. Revert product stock quantity
    await tx
      .update(productsTable)
      .set({
        stock_quantity: sql`${productsTable.stock_quantity} - ${movement.quantity}`,
        updated_at: sql`now()`,
      })
      .where(eq(productsTable.id, movement.product_id))

    // 3. Unlink the original movement from the reference so it's not "cleaned up" again
    // if this function is called multiple times. Actually, instead of unlinking,
    // we should just null out the reference_id on the ORIGINAL movement to "consume" it.
    await tx
      .update(stockMovementsTable)
      .set({
        reference_type: null,
        reference_id: null,
      })
      .where(eq(stockMovementsTable.id, movement.id))
  }
}
export async function reconcileProductStockTx(
  tx: PgTransaction<any, any, any>,
  productId: number,
) {
  // 1. Lock Product
  const product = await tx
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .for('update')
    .then((rows) => rows[0])

  if (!product) fail('PRODUCT_NOT_FOUND')

  // 2. Sum Ledger Truth
  const result = await tx
    .select({
      total: sql<number>`COALESCE(SUM(${stockMovementsTable.quantity}), 0)`,
    })
    .from(stockMovementsTable)
    .where(eq(stockMovementsTable.product_id, productId))

  const ledgerTotal = Number(result[0]?.total ?? 0)

  // 3. Update shelf count to match ledger
  await tx
    .update(productsTable)
    .set({
      stock_quantity: ledgerTotal,
      updated_at: sql`now()`,
    })
    .where(eq(productsTable.id, productId))

  return ledgerTotal
}
