import { z } from 'zod'

export const homeSearchSchema = z.object({
  customerId: z.number().optional(),
  year: z.number().optional(),
})

export type HomeSearch = z.infer<typeof homeSearchSchema>

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
  pageIndex: z.coerce.number().int().min(0).catch(0),
  pageSize: z.coerce.number().int().min(10).max(100).catch(100),
  sortDir: z.enum(['asc', 'desc']).catch('asc'),
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
  sortBy: z.enum(productSortFields).catch('code'),
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
  sortBy: z.enum(customerSortFields).catch('code'),
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
  sortBy: z.enum(orderSortFields).catch('order_date'),
  sortDir: z.enum(['asc', 'desc']).catch('desc'),
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
  sortBy: z.enum(deliveriesSortFields).catch('delivery_number'),
  sortDir: z.enum(['asc', 'desc']).catch('desc'),
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
  pageIndex: z.coerce.number().int().min(0).catch(0),
  pageSize: z.coerce.number().int().min(10).max(100).catch(100),
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
  productId: z.coerce.number().int().positive().optional(),
})

export type StockSearch = z.infer<typeof stockSearchSchema>
