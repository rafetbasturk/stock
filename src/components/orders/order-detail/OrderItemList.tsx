import { DetailTable } from '@/components/DetailTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ListCheckIcon } from 'lucide-react'
import { CustomItemRow, getCustomColumns } from './customColumns'
import { getColumns } from './columns'
import { DeliveryWithItems, OrderWithItems } from '@/types'
import { TFunction } from 'i18next'
import { UseNavigateResult } from '@tanstack/react-router'

type Props = {
  order: OrderWithItems
  deliveries: DeliveryWithItems[]
  t: TFunction
  navigate: UseNavigateResult<'/products/$id'>
}

export default function OrderItemList({ order, deliveries, t, navigate }: Props) {
  const columns = getColumns(deliveries)
  const customColumns = getCustomColumns()

  return (
    <Card className="border-l-4 border-l-primary/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListCheckIcon className="size-5 text-primary" />
          {t('orders.items_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {order.is_custom_order ? (
          <DetailTable<CustomItemRow, unknown>
            data={order.customItems}
            columns={customColumns}
          />
        ) : (
          <DetailTable
            data={order.items}
            columns={columns}
            onRowClick={(item) =>
              navigate({
                to: `/products/$id`,
                params: { id: String(item.product.id) },
              })
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
