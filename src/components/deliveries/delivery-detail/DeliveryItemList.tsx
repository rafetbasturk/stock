import { useTranslation } from 'react-i18next'
import { getColumns } from './columns'
import type { DeliveryItemRow, DeliveryWithItems } from '@/types'
import { DetailTable } from '@/components/DetailTable'
import { useAppTimeZone } from '@/hooks/useAppTimeZone'

interface Props {
  delivery: DeliveryWithItems
}

export default function DeliveryItemList({ delivery }: Props) {
  const { i18n } = useTranslation()
  const timeZone = useAppTimeZone()
  const items = delivery.items
  const sign = delivery.kind === 'RETURN' ? -1 : 1

  const rows: Array<DeliveryItemRow> = items
    .sort((a: any, b: any) => a.order_number - b.order_number)
    .map((di: any) => {
      const isCustom = !!di.customOrderItem

      const orderSource = di.orderItem ?? di.customOrderItem

      const order_number = orderSource?.order?.order_number ?? '—'
      const order_date = orderSource?.order?.order_date
        ? new Date(orderSource.order.order_date)
        : new Date()

      const currency = orderSource?.currency ?? 'TRY'

      const product = di.orderItem?.product
      const productName = product?.name ?? di.customOrderItem?.name ?? '—'
      const productCode =
        product?.code ??
        di.customOrderItem?.custom_code ??
        di.customOrderItem?.name ??
        '—'

      const unit = product?.unit ?? di.customOrderItem?.unit ?? 'adet'

      const unitPrice = orderSource?.unit_price ?? 0
      const deliveredQty = sign * (di.delivered_quantity ?? 0)
      const totalPrice = unitPrice * deliveredQty

      return {
        id: di.id,
        product_code: productCode,
        product_name: productName,
        unit,
        unit_price: unitPrice / 100,
        delivered_quantity: deliveredQty,
        total_price: totalPrice / 100,
        order_number,
        order_date,
        currency,
        is_custom: isCustom,
      }
    })

  const columns = getColumns(i18n.language, timeZone)

  return <DetailTable data={rows} columns={columns} />
}
