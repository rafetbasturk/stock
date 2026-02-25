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

export const deliveryKindEnum = pgEnum('delivery_kind', ['DELIVERY', 'RETURN'])

// Define enums for Postgres
export const statusEnum = pgEnum('status', [
  'KAYIT',
  'ÜRETİM',
  'KISMEN HAZIR',
  'HAZIR',
  'BİTTİ',
  'İPTAL',
] as const)

export const unitEnum = pgEnum('unit', ['adet', 'saat', 'kg', 'metre'] as const)

export const currencyEnum = pgEnum('currency', ['TRY', 'EUR', 'USD'] as const)
