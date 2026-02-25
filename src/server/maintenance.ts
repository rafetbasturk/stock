import { createServerFn } from '@tanstack/react-start'
import { eq, isNull, sql } from 'drizzle-orm'
import { reconcileProductStockTx } from './services/stockService'
import { requireAuth } from './auth/requireAuth'
import { productsTable, stockMovementsTable } from '@/db/schema'
import { db } from '@/db'

export const getStockIntegrityReport = createServerFn().handler(async () => {
  await requireAuth()

  const report = await db.transaction(async (tx) => {
    // Find products where stock_quantity != SUM(movements)
    const products = await tx
      .select({
        id: productsTable.id,
        name: productsTable.name,
        code: productsTable.code,
        current_stock: productsTable.stock_quantity,
      })
      .from(productsTable)
      .where(isNull(productsTable.deleted_at))

    const issues = []

    for (const p of products) {
      const result = await tx
        .select({
          total: sql<number>`COALESCE(SUM(${stockMovementsTable.quantity}), 0)`,
        })
        .from(stockMovementsTable)
        .where(eq(stockMovementsTable.product_id, p.id))

      const ledgerSum = Number(result[0]?.total ?? 0)

      if (ledgerSum !== p.current_stock) {
        issues.push({
          id: p.id,
          name: p.name,
          code: p.code,
          shelf: p.current_stock,
          ledger: ledgerSum,
          diff: ledgerSum - p.current_stock,
        })
      }
    }

    return issues
  })

  return report
})

export const reconcileAllStock = createServerFn().handler(async () => {
  await requireAuth()

  const results = await db.transaction(async (tx) => {
    const products = await tx
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(isNull(productsTable.deleted_at))

    let fixedCount = 0
    for (const p of products) {
      await reconcileProductStockTx(tx, p.id)
      fixedCount++
    }
    return { success: true, fixedCount }
  })

  return results
})
