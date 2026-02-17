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

const optionalString = z
  .preprocess((v) => {
    if (v == null || typeof v !== 'string') return undefined
    const t = v.trim()
    return t.length ? t : undefined
  }, z.string().optional())
  .optional()

const sharedSearchSchema = z.object({
  pageIndex: z.coerce.number().int().min(0).catch(0),
  pageSize: z.coerce.number().int().min(10).max(100).catch(100),
  sortDir: z.enum(['asc', 'desc']).catch('asc'),
  q: optionalString,
})

export const productsSearchSchema = z.object({
  ...sharedSearchSchema.shape,
  sortBy: z.enum(productSortFields).catch('code'),
  material: optionalString,
  customerId: optionalString,
})

export type ProductsSearch = z.infer<typeof productsSearchSchema>

export const normalizeProductsSearch = (
  s: Partial<ProductsSearch>,
): ProductsSearch => ({
  pageIndex: s.pageIndex ?? 0,
  pageSize: s.pageSize ?? 100,
  q: s.q || undefined,
  sortBy: s.sortBy ?? 'code',
  sortDir: s.sortDir ?? 'asc',
  material: s.material || undefined,
  customerId: s.customerId || undefined,
})

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

export const normalizeCustomersSearch = (
  s: Partial<CustomersSearch>,
): CustomersSearch => ({
  pageIndex: s.pageIndex ?? 0,
  pageSize: s.pageSize ?? 100,
  q: s.q || undefined,
  sortBy: s.sortBy ?? 'code',
  sortDir: s.sortDir ?? 'asc',
})

export const orderSortFields = [
  'order_number',
  'order_date',
  'status',
  'customer',
  'currency',
] as const

export const ordersSearchSchema = z.object({
  ...sharedSearchSchema.shape,
  sortBy: z.enum(orderSortFields).catch('order_date'),
  sortDir: z.enum(['asc', 'desc']).catch('desc'),
  status: optionalString,
  customerId: optionalString,
  startDate: optionalString,
  endDate: optionalString,
})

export type OrdersSearch = z.infer<typeof ordersSearchSchema>

export const normalizeOrdersSearch = (
  s: Partial<OrdersSearch>,
): OrdersSearch => ({
  pageIndex: s.pageIndex ?? 0,
  pageSize: s.pageSize ?? 100,
  q: s.q || undefined,
  sortBy: s.sortBy ?? 'order_date',
  sortDir: s.sortDir ?? 'desc',
  status: s.status || undefined,
  customerId: s.customerId || undefined,
  startDate: s.startDate || undefined,
  endDate: s.endDate || undefined,
})

export const deliveriesSortFields = [
  'delivery_number',
  'delivery_date',
  'customer',
] as const

export const deliveriesSearchSchema = z.object({
  ...sharedSearchSchema.shape,
  sortBy: z.enum(deliveriesSortFields).catch('delivery_number'),
  sortDir: z.enum(['asc', 'desc']).catch('desc'),
  customerId: optionalString,
  startDate: optionalString,
  endDate: optionalString,
})

export type DeliveriesSearch = z.infer<typeof deliveriesSearchSchema>

export const normalizeDeliveriesSearch = (
  s: Partial<DeliveriesSearch>,
): DeliveriesSearch => ({
  pageIndex: s.pageIndex ?? 0,
  pageSize: s.pageSize ?? 100,
  q: s.q || undefined,
  sortBy: s.sortBy ?? 'delivery_number',
  sortDir: s.sortDir ?? 'desc',
  customerId: s.customerId || undefined,
  startDate: s.startDate || undefined,
  endDate: s.endDate || undefined,
})

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
  q: optionalString,
  movementType: optionalString,
  productId: z
    .preprocess((v) => {
      const n = Number(v)
      return isNaN(n) ? undefined : n
    }, z.number().int().positive().optional())
    .optional(),
})

export type StockSearch = z.infer<typeof stockSearchSchema>
