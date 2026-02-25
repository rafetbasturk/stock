import {
  
  getCustomDeliveryColumns
} from './customColumns'
import type {CustomDeliveryRow} from './customColumns';
import type { DeliveryWithItems, OrderWithItems } from '@/types'
import { DetailTable } from '@/components/DetailTable'

interface Props {
  delivery: DeliveryWithItems
  order: OrderWithItems
}

const flattenCustomDeliveryItems = (
  delivery: DeliveryWithItems,
  order: OrderWithItems,
): Array<CustomDeliveryRow> => {
  const sign = delivery.kind === 'RETURN' ? -1 : 1

  return delivery.items.map((item) => {
    const customItem = item.customOrderItem

    const unitPrice = customItem?.unit_price ?? 0
    const currency = customItem?.currency ?? order.currency ?? 'TRY'
    const deliveredQty = item.delivered_quantity
    const totalAmount = sign * unitPrice * deliveredQty

    return {
      id: item.id,
      deliveryId: delivery.id,
      name: customItem?.name ?? 'Bilinmeyen Kalem',
      unit: customItem?.unit ?? '',
      deliveredQuantity: sign * deliveredQty,
      deliveryDate: new Date(delivery.delivery_date),
      deliveryNumber: delivery.delivery_number,
      notes: delivery.notes ?? null,
      unitPrice,
      totalAmount,
      currency,
    }
  })
}

export default function CustomOrderDeliveryList({ delivery, order }: Props) {
  const data = flattenCustomDeliveryItems(delivery, order)

  const columns = getCustomDeliveryColumns()

  return <DetailTable data={data} columns={columns} />
}
