export type StockMovementType =
  | 'IN'
  | 'OUT'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'RESERVE'
  | 'RELEASE'

export const STOCK_MOVEMENT_TYPES: Array<StockMovementType> = [
  'IN',
  'OUT',
  'TRANSFER',
  'ADJUSTMENT',
  'RESERVE',
  'RELEASE',
]

export const STOCK_MOVEMENT_BADGE_CLASSES: Record<StockMovementType, string> = {
  IN: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  OUT: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  TRANSFER:
    'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400',
  ADJUSTMENT:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  RESERVE:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  RELEASE:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300',
}

export function getStockMovementTypeLabel(
  t: (key: string) => string,
  type: StockMovementType,
) {
  switch (type) {
    case 'IN':
      return t('stock_in')
    case 'OUT':
      return t('stock_out')
    case 'TRANSFER':
      return t('stock_transfer')
    case 'ADJUSTMENT':
      return t('adjust_stock')
    case 'RESERVE':
      return t('movement_types.reserve')
    case 'RELEASE':
      return t('movement_types.release')
    default:
      return type
  }
}

export function getStockMovementFilterOptions(t: (key: string) => string) {
  return STOCK_MOVEMENT_TYPES.map((type) => ({
    value: type,
    label: getStockMovementTypeLabel(t, type),
  }))
}

export function getStockQuantityClass(quantity: number) {
  return quantity > 0 ? 'text-emerald-600' : 'text-red-600'
}

