import {
  Customer,
  DeliveryListRow,
  MovementRow,
  OrderListRow,
  ProductListRow,
} from '@/types'

export type CustomersModalState =
  | { type: 'closed' }
  | { type: 'adding' }
  | { type: 'editing'; customer: Customer }

export type DeliveriesModalState =
  | { type: 'closed' }
  | { type: 'adding' }
  | { type: 'editing'; delivery: DeliveryListRow }

export type OrdersModalState =
  | { type: 'closed' }
  | { type: 'adding' }
  | { type: 'editing'; order: OrderListRow }

export type ProductsModalState =
  | { type: 'closed' }
  | { type: 'adding' }
  | { type: 'editing'; product: ProductListRow }
  | { type: 'adjusting'; product: ProductListRow }

export type HistoryModalState = {
  type: 'closed' | 'editing' | 'deleting'
  movement: MovementRow | null
}
