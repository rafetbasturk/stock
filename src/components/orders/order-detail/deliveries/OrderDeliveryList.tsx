import { getColumns } from './columns'
import type { DeliveryRow, DeliveryWithItems, OrderWithItems } from '@/types'
import { DetailTable } from '@/components/DetailTable'

interface Props {
  delivery: DeliveryWithItems
  order: OrderWithItems
}

const flattenDeliveryItems = (
  delivery: DeliveryWithItems,
  order: OrderWithItems,
): Array<DeliveryRow> => {
  const sign = delivery.kind === 'RETURN' ? -1 : 1

  return delivery.items.map((item) => {
    // Standard order item lookup
    const orderItem = item.orderItem
    const unitPrice = orderItem?.unit_price ?? 0
    const currency = orderItem?.currency ?? order.currency ?? 'TRY'
    const totalAmount = sign * unitPrice * item.delivered_quantity

    return {
      productCode: orderItem?.product.code || '-',
      productName: orderItem?.product.name || '-',
      deliveredQuantity: sign * item.delivered_quantity,
      deliveryDate: new Date(delivery.delivery_date),
      deliveryNumber: delivery.delivery_number,
      notes: delivery.notes ?? null,
      deliveryId: delivery.id,
      unitPrice,
      totalAmount,
      currency,
    }
  })
}

export default function OrderDeliveryList({ delivery, order }: Props) {
  const data = flattenDeliveryItems(delivery, order)

  const columns = getColumns()

  return <DetailTable data={data} columns={columns} />
}
