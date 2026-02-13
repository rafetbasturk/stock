// src/types.d.ts
import type {
  customersTable,
  deliveriesTable,
  deliveryItemsTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  stockMovementsTable,
} from './db/schema'
import type {
  currencyArray,
  materialArray,
  processArray,
  statusArray,
  unitArray,
} from './lib/constants'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends unknown, TValue> {
    filterTitle?: string
    className?: string | ((cell: TValue, row: TData) => string)
    headerClassName?: string
    isFilterOnly?: boolean
  }
  interface TableMeta<TData extends unknown> {
    expandedRowId?: string | number | null
    onExpandToggle?: (rowId: string | number) => void
  }
}

export interface ActionMenuItem<TData> {
  label: string
  action: (item: TData) => void
  isDestructive?: boolean
  separatorAfter?: boolean
}

export type Unit = (typeof unitArray)[number]
export type Status = (typeof statusArray)[number]
export type Currency = (typeof currencyArray)[number]
export type Process = (typeof processArray)[number]
export type Material = (typeof materialArray)[number]

export type Product = typeof productsTable.$inferSelect
export type InsertProduct = typeof productsTable.$inferInsert

export type Customer = typeof customersTable.$inferSelect
export type InsertCustomer = typeof customersTable.$inferInsert

export type Order = typeof ordersTable.$inferSelect
export type InsertOrder = typeof ordersTable.$inferInsert

export type OrderItem = typeof orderItemsTable.$inferSelect
export type InsertOrderItem = typeof orderItemsTable.$inferInsert

export type StockMovement = typeof stockMovementsTable.$inferSelect
export type InsertStockMovement = typeof stockMovementsTable.$inferInsert

export type StockMovementType = StockMovementInsert['movement_type']
export type StockReferenceType = StockMovementInsert['reference_type']

export interface OrderItemWithProduct extends OrderItem {
  product: Product
}

export interface OrderWithCustomer extends Order {
  customer: Customer
  items: OrderItemWithProduct[]
  customItems: CustomOrderItem[]
}

export type CustomOrderItem = InferSelectModel<typeof customOrderItemsTable>
export type NewCustomOrderItem = InferInsertModel<typeof customOrderItemsTable>

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[]
  customItems: CustomOrderItem[]
}

export type NewOrderItem = Omit<InsertOrderItem, 'order_id'>

export type Delivery = typeof deliveriesTable.$inferSelect
export type InsertDelivery = typeof deliveriesTable.$inferInsert

export type DeliveryItem = typeof deliveryItemsTable.$inferSelect
export type InsertDeliveryItem = typeof deliveryItemsTable.$inferInsert

interface DeliveryItemWithOrderItems extends DeliveryItem {
  orderItem:
    | (OrderItemWithProduct & {
        deliveries: {
          id: number
          delivered_quantity: number
          delivery: {
            delivery_number: string
            delivery_date: Date
          }
        }[]
      })
    | null
  customOrderItem: CustomOrderItem | null
}

export interface DeliveryWithItems extends Delivery {
  customer: Customer
  items: DeliveryItemWithOrderItems[]
}

export type DeliveryListRow = DeliveryWithItems & {
  total_amount: number
  currency: Currency
}

export type OrderListRow = OrderWithCustomer & {
  total_amount: number
  currency: Currency
}

export type ProductListRow = Product & {
  customer: Customer
}

export type OrderItemSubmitPayload = {
  id?: number
  product_id: number
  unit_price: number
  quantity: number
  currency?: Currency | null
}

export type CustomOrderItemSubmitPayload = {
  id?: number
  name?: string
  unit?: string
  quantity?: number
  unit_price?: number
  currency?: Currency | null
  notes?: string
}

export type OrderSubmitPayload = InsertOrder & {
  items: OrderItemSubmitPayload[]
  customItems: CustomOrderItemSubmitPayload[]
}

export interface DeliveryRow {
  productCode: string
  productName: string
  deliveredQuantity: number
  deliveryDate: Date
  deliveryNumber: string | null
  notes: string | null
  deliveryId: number
  unitPrice: number
  totalAmount: number
  currency: string
}

export interface PaginatedResult<T> {
  data: T[]
  pageIndex: number
  pageSize: number
  total: number
}
