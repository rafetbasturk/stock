import { and, eq, inArray, sql } from 'drizzle-orm'
import type { InsertStockMovement } from '@/types'
import { productsTable, stockMovementsTable } from '@/db/schema'
import { fail } from '@/lib/error/core/serverError'
import type { PgTransaction } from 'drizzle-orm/pg-core'

async function findTransferPairTx(
  tx: PgTransaction<any, any, any>,
  movement: typeof stockMovementsTable.$inferSelect,
) {
  if (movement.reference_type !== 'transfer' || !movement.reference_id) {
    return null
  }

  const pair = await tx
    .select()
    .from(stockMovementsTable)
    .where(
      and(
        eq(stockMovementsTable.reference_type, 'transfer'),
        eq(stockMovementsTable.product_id, movement.reference_id),
        eq(stockMovementsTable.reference_id, movement.product_id),
        eq(stockMovementsTable.created_by, movement.created_by),
        eq(stockMovementsTable.created_at, movement.created_at),
      ),
    )
    .for('update')
    .then((rows) => rows.find((row) => row.id !== movement.id))

  return pair ?? null
}

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

export async function createStockTransferTx(
  tx: PgTransaction<any, any, any>,
  input: {
    from_product_id: number
    to_product_id: number
    quantity: number
    notes?: string | null
    created_by: number
  },
) {
  if (input.quantity <= 0) fail('INVALID_STOCK_QUANTITY')
  if (input.from_product_id === input.to_product_id) fail('INVALID_REFERENCE')

  const lockIds =
    input.from_product_id < input.to_product_id
      ? [input.from_product_id, input.to_product_id]
      : [input.to_product_id, input.from_product_id]

  const products = await tx
    .select({
      id: productsTable.id,
      stock_quantity: productsTable.stock_quantity,
    })
    .from(productsTable)
    .where(
      and(
        inArray(productsTable.id, lockIds),
        sql`${productsTable.deleted_at} IS NULL`,
      ),
    )
    .for('update')

  if (products.length !== 2) fail('PRODUCT_NOT_FOUND')

  const byId = new Map(products.map((product) => [product.id, product]))
  const fromProduct = byId.get(input.from_product_id)
  const toProduct = byId.get(input.to_product_id)

  if (!fromProduct || !toProduct) fail('PRODUCT_NOT_FOUND')
  if (fromProduct.stock_quantity < input.quantity) fail('INSUFFICIENT_STOCK')

  await tx.insert(stockMovementsTable).values([
    {
      product_id: input.from_product_id,
      movement_type: 'TRANSFER',
      quantity: -input.quantity,
      reference_type: 'transfer',
      reference_id: input.to_product_id,
      notes: input.notes ?? null,
      created_by: input.created_by,
    },
    {
      product_id: input.to_product_id,
      movement_type: 'TRANSFER',
      quantity: input.quantity,
      reference_type: 'transfer',
      reference_id: input.from_product_id,
      notes: input.notes ?? null,
      created_by: input.created_by,
    },
  ])

  await tx
    .update(productsTable)
    .set({
      stock_quantity: sql`${productsTable.stock_quantity} - ${input.quantity}`,
      updated_at: sql`now()`,
    })
    .where(eq(productsTable.id, input.from_product_id))

  await tx
    .update(productsTable)
    .set({
      stock_quantity: sql`${productsTable.stock_quantity} + ${input.quantity}`,
      updated_at: sql`now()`,
    })
    .where(eq(productsTable.id, input.to_product_id))
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

  if (
    movement.reference_type &&
    movement.reference_type !== 'adjustment' &&
    movement.reference_type !== 'transfer'
  ) {
    fail('RESTRICTED_STOCK_MOVEMENT')
  }

  if (movement.reference_type === 'transfer') {
    const pair = await findTransferPairTx(tx, movement)
    if (!pair) fail('STOCK_MOVEMENT_NOT_FOUND')

    const lockIds =
      movement.product_id < pair.product_id
        ? [movement.product_id, pair.product_id]
        : [pair.product_id, movement.product_id]

    const products = await tx
      .select({
        id: productsTable.id,
        stock_quantity: productsTable.stock_quantity,
      })
      .from(productsTable)
      .where(inArray(productsTable.id, lockIds))
      .for('update')

    const byId = new Map(products.map((product) => [product.id, product]))
    const movementProduct = byId.get(movement.product_id)
    const pairProduct = byId.get(pair.product_id)
    if (!movementProduct || !pairProduct) fail('PRODUCT_NOT_FOUND')

    const movementNewStock = movementProduct.stock_quantity - movement.quantity
    const pairNewStock = pairProduct.stock_quantity - pair.quantity

    if (movementNewStock < 0 || pairNewStock < 0) fail('INSUFFICIENT_STOCK')

    await tx
      .update(productsTable)
      .set({
        stock_quantity: movementNewStock,
        updated_at: sql`now()`,
      })
      .where(eq(productsTable.id, movement.product_id))

    await tx
      .update(productsTable)
      .set({
        stock_quantity: pairNewStock,
        updated_at: sql`now()`,
      })
      .where(eq(productsTable.id, pair.product_id))

    await tx
      .delete(stockMovementsTable)
      .where(inArray(stockMovementsTable.id, [movement.id, pair.id]))
    return
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

  if (
    movement.reference_type &&
    movement.reference_type !== 'adjustment' &&
    movement.reference_type !== 'transfer'
  ) {
    fail('RESTRICTED_STOCK_MOVEMENT')
  }

  if (movement.reference_type === 'transfer') {
    const pair = await findTransferPairTx(tx, movement)
    if (!pair) fail('STOCK_MOVEMENT_NOT_FOUND')

    const nextQuantity = input.quantity ?? movement.quantity
    if (nextQuantity === 0) fail('INVALID_STOCK_QUANTITY')
    if (Math.sign(nextQuantity) !== Math.sign(movement.quantity)) {
      fail('INVALID_STOCK_QUANTITY')
    }

    const nextPairQuantity = -nextQuantity
    const diffMovement = nextQuantity - movement.quantity
    const diffPair = nextPairQuantity - pair.quantity

    if (diffMovement !== 0 || diffPair !== 0) {
      const lockIds =
        movement.product_id < pair.product_id
          ? [movement.product_id, pair.product_id]
          : [pair.product_id, movement.product_id]

      const products = await tx
        .select({
          id: productsTable.id,
          stock_quantity: productsTable.stock_quantity,
        })
        .from(productsTable)
        .where(inArray(productsTable.id, lockIds))
        .for('update')

      const byId = new Map(products.map((product) => [product.id, product]))
      const movementProduct = byId.get(movement.product_id)
      const pairProduct = byId.get(pair.product_id)
      if (!movementProduct || !pairProduct) fail('PRODUCT_NOT_FOUND')

      const movementNewStock = movementProduct.stock_quantity + diffMovement
      const pairNewStock = pairProduct.stock_quantity + diffPair
      if (movementNewStock < 0 || pairNewStock < 0) fail('INSUFFICIENT_STOCK')

      await tx
        .update(productsTable)
        .set({
          stock_quantity: movementNewStock,
          updated_at: sql`now()`,
        })
        .where(eq(productsTable.id, movement.product_id))

      await tx
        .update(productsTable)
        .set({
          stock_quantity: pairNewStock,
          updated_at: sql`now()`,
        })
        .where(eq(productsTable.id, pair.product_id))
    }

    await tx
      .update(stockMovementsTable)
      .set({
        quantity: nextQuantity,
        notes: input.notes ?? movement.notes,
        updated_at: sql`now()`,
      })
      .where(eq(stockMovementsTable.id, movement.id))

    await tx
      .update(stockMovementsTable)
      .set({
        quantity: nextPairQuantity,
        notes: input.notes ?? pair.notes,
        updated_at: sql`now()`,
      })
      .where(eq(stockMovementsTable.id, pair.id))

    return
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
    // 1. Lock product and validate cleanup will not produce negative stock
    const product = await tx
      .select({
        id: productsTable.id,
        stock_quantity: productsTable.stock_quantity,
      })
      .from(productsTable)
      .where(eq(productsTable.id, movement.product_id))
      .for('update')
      .then((rows) => rows[0])

    if (!product) fail('PRODUCT_NOT_FOUND')

    const revertedStock = product.stock_quantity - movement.quantity
    if (revertedStock < 0) fail('INSUFFICIENT_STOCK')

    // 2. Create reversal movement
    await tx.insert(stockMovementsTable).values({
      product_id: movement.product_id,
      quantity: -movement.quantity, // Reverse the quantity
      movement_type: 'ADJUSTMENT',
      reference_type: null,
      reference_id: null,
      created_by: userId,
      notes: `Reversal of ${movement.movement_type} #${movement.id} (${reference_type} #${reference_id} change/removal)`,
    })

    // 3. Revert product stock quantity
    await tx
      .update(productsTable)
      .set({
        stock_quantity: revertedStock,
        updated_at: sql`now()`,
      })
      .where(eq(productsTable.id, movement.product_id))

    // 4. Unlink the original movement from the reference so it's not "cleaned up" again
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
