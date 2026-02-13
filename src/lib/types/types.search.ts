import { z } from 'zod'
import { fallback } from '@tanstack/zod-adapter'

export type HomeSearch = {
  customerId?: number
  year?: number
}

export const productSortFields = [
  'code',
  'name',
  'price',
  'other_codes',
  'material',
  'post_process',
  'coating',
] as const

export type ProductSortField = (typeof productSortFields)[number]

const sharedSearchSchema = z.object({
  pageIndex: fallback(z.coerce.number().int().min(0), 0),
  pageSize: fallback(z.coerce.number().int().min(10).max(100), 100),
  sortDir: fallback(z.enum(['asc', 'desc']), 'asc'),
  q: z
    .preprocess((v) => {
      if (typeof v !== 'string') return undefined
      const t = v.trim()
      return t.length ? t : undefined
    }, z.string().min(1))
    .optional(),
})

export const productsSearchSchema = z.object({
  ...sharedSearchSchema.shape,
  sortBy: fallback(z.enum(productSortFields), 'code'),
  material: z
    .preprocess((v) => {
      if (v == null) return undefined
      if (Array.isArray(v)) return v.join('|')
      if (typeof v === 'string') {
        const t = v.trim()
        return t.length ? t : undefined
      }
      return undefined
    }, z.string())
    .optional(),
  customer: z
    .preprocess((v) => {
      if (v == null) return undefined
      if (typeof v === 'string') {
        const t = v.trim()
        return t.length ? t : undefined
      }
      return undefined
    }, z.string())
    .optional(),
})

export type ProductsSearch = z.infer<typeof productsSearchSchema>

export const customerSortFields = [
  'code',
  'name',
  'email',
  'address',
  'phone',
] as const

export const customersSearchSchema = z.object({
  ...sharedSearchSchema.shape,
  sortBy: fallback(z.enum(customerSortFields), 'code'),
})

export type CustomersSearch = z.infer<typeof customersSearchSchema>

export const orderSortFields = [
  'order_number',
  'order_date',
  'status',
  'customer',
] as const

export const ordersSearchSchema = z.object({
  ...sharedSearchSchema.shape,
  sortBy: fallback(z.enum(orderSortFields), 'order_date'),
  sortDir: fallback(z.enum(['asc', 'desc']), 'desc'),
  status: z
    .preprocess((v) => {
      if (v == null) return undefined
      if (Array.isArray(v)) return v.join('|')
      if (typeof v === 'string') {
        const t = v.trim()
        return t.length ? t : undefined
      }
      return undefined
    }, z.string())
    .optional(),
  customerId: z
    .preprocess((v) => {
      if (v == null) return undefined
      if (Array.isArray(v)) return v.join('|')
      if (typeof v === 'string') {
        const t = v.trim()
        return t.length ? t : undefined
      }
      return undefined
    }, z.string())
    .optional(),
  startDate: z
    .preprocess((v) => {
      if (typeof v !== 'string') return undefined
      const t = v.trim()
      return t.length ? t : undefined
    }, z.string())
    .optional(),
  endDate: z
    .preprocess((v) => {
      if (typeof v !== 'string') return undefined
      const t = v.trim()
      return t.length ? t : undefined
    }, z.string())
    .optional(),
})

export type OrdersSearch = z.infer<typeof ordersSearchSchema>

export const deliveriesSortFields = [
  'delivery_number',
  'delivery_date',
  'customer',
] as const

export const deliveriesSearchSchema = z.object({
  ...sharedSearchSchema.shape,
  sortBy: fallback(z.enum(deliveriesSortFields), 'delivery_number'),
  sortDir: fallback(z.enum(['asc', 'desc']), 'desc'),
  customerId: z
    .preprocess((v) => {
      if (v == null) return undefined
      if (Array.isArray(v)) return v.join('|')
      if (typeof v === 'string') {
        const t = v.trim()
        return t.length ? t : undefined
      }
      return undefined
    }, z.string())
    .optional(),
  startDate: z
    .preprocess((v) => {
      if (typeof v !== 'string') return undefined
      const t = v.trim()
      return t.length ? t : undefined
    }, z.string())
    .optional(),
  endDate: z
    .preprocess((v) => {
      if (typeof v !== 'string') return undefined
      const t = v.trim()
      return t.length ? t : undefined
    }, z.string())
    .optional(),
})

export type DeliveriesSearch = z.infer<typeof deliveriesSearchSchema>

export const stockMovementTypes = [
  'IN',
  'OUT',
  'ADJUSTMENT',
  'RESERVE',
  'RELEASE',
] as const

export const stockSearchSchema = z.object({
  pageIndex: fallback(z.coerce.number().int().min(0), 0),
  pageSize: fallback(z.coerce.number().int().min(10).max(100), 20),
  q: z
    .preprocess((v) => {
      if (typeof v !== 'string') return undefined
      const t = v.trim()
      return t.length ? t : undefined
    }, z.string().min(1))
    .optional(),
  movementType: z
    .preprocess((v) => {
      if (v == null) return undefined
      if (Array.isArray(v)) return v.join(',')
      if (typeof v === 'string') {
        const t = v.trim()
        return t.length ? t : undefined
      }
      return undefined
    }, z.string())
    .optional(),
  productId: fallback(z.coerce.number().int().positive().optional(), undefined),
})

export type StockSearch = z.infer<typeof stockSearchSchema>
