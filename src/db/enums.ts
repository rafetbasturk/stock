import { statusArray, unitArray } from '@/lib/constants'
import { currencyArray } from '@/lib/currency'
import { pgEnum } from 'drizzle-orm/pg-core'

export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
  'IN', // stock entrance
  'OUT', // stock exit
  'TRANSFER', // transfer between products
  'ADJUSTMENT', // manual correction
  'RESERVE', // optional future
  'RELEASE', // optional future
])

export const stockReferenceTypeEnum = pgEnum('stock_reference_type', [
  'order',
  'delivery',
  'adjustment',
  'purchase',
  'transfer',
])

export const deliveryKindEnum = pgEnum('delivery_kind', [
  'DELIVERY',
  'RETURN',
])

// Define enums for Postgres
export const statusEnum = pgEnum(
  'status',
  statusArray as unknown as [string, ...string[]],
)
export const unitEnum = pgEnum(
  'unit',
  unitArray as unknown as [string, ...string[]],
)
export const currencyEnum = pgEnum(
  'currency',
  currencyArray as unknown as [string, ...string[]],
)
