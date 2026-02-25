import { ListCheckIcon } from 'lucide-react'
import { getCustomColumns } from './customColumns'
import { getColumns } from './columns'
import type { CustomItemRow} from './customColumns';
import type { DeliveryWithItems, OrderWithItems } from '@/types'
import type { TFunction } from 'i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailTable } from '@/components/DetailTable'

type Props = {
  order: OrderWithItems
  deliveries: Array<DeliveryWithItems>
  t: TFunction
  onProductClick: (productId: number) => void
}

export default function OrderItemList({
  order,
  deliveries,
  t,
  onProductClick,
}: Props) {
  const columns = getColumns(deliveries)
  const customColumns = getCustomColumns()

  return (
    <Card className="border-l-4 border-l-primary shadow-sm">
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
            onRowClick={(item) => onProductClick(item.product.id)}
          />
        )}
      </CardContent>
    </Card>
  )
}
