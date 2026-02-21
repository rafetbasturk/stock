import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Calendar,
  CoinsIcon,
  Edit,
  InfoIcon,
  ReceiptText,
  Truck,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useState,
  useMemo,
  type ElementType,
  type PropsWithChildren,
} from 'react'
import PageHeader from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { convertToCurrencyFormat } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { deliveryQuery } from '@/lib/queries/deliveries'
import { ordersSelectQuery } from '@/lib/queries/orders'
import { DeliveryForm } from '@/components/deliveries/DeliveryForm'
import { Button } from '@/components/ui/button'
import DeliveryItemList from '@/components/deliveries/delivery-detail/DeliveryItemList'
import type { OrderMinimal } from '@/components/deliveries/DeliveryForm'

export const Route = createFileRoute('/deliveries/$id')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const deliveryId = parseDeliveryId(params.id)
    if (deliveryId === null) {
      throw redirectToDeliveries()
    }

    await context.queryClient.ensureQueryData(deliveryQuery(deliveryId))
  },
})

function RouteComponent() {
  const { t, i18n } = useTranslation('details')
  const { id } = Route.useParams()
  const deliveryId = parseDeliveryId(id)

  if (deliveryId === null) {
    throw redirectToDeliveries()
  }

  const [isEditing, setIsEditing] = useState(false)

  const { data: delivery } = useSuspenseQuery(deliveryQuery(deliveryId))

  if (!delivery) {
    throw redirectToDeliveries()
  }

  // Fetch all available orders when editing
  const { data: availableOrders } = useSuspenseQuery(ordersSelectQuery)

  // Extract and merge orders from delivery items + all available orders for customer
  const orders = useMemo(() => {
    const orderMap = new Map<number, OrderMinimal>()

    // First, add all available orders for this customer
    const customerOrders =
      availableOrders?.filter(
        (o: any) => o.customer_id === delivery.customer.id,
      ) || []

    customerOrders.forEach((order: any) => {
      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, {
          id: order.id,
          customer_id: order.customer_id,
          order_number: order.order_number,
          status: order.status,
          order_date: order.order_date,
          items: order.items || [],
          customItems: order.customItems || [],
        })
      }
    })

    // Then, enhance with delivery items data (to preserve delivery history)
    delivery.items.forEach((item) => {
      const orderItem = item.orderItem
      if (orderItem?.order) {
        const order = orderItem.order
        if (!orderMap.has(order.id)) {
          orderMap.set(order.id, {
            id: order.id,
            customer_id: order.customer_id,
            order_number: order.order_number,
            status: order.status,
            order_date: order.order_date,
            items: [],
            customItems: [],
          })
        }

        const mapOrder = orderMap.get(order.id)!
        if (orderItem && !mapOrder.items?.some((i) => i.id === orderItem.id)) {
          mapOrder.items = [
            ...(mapOrder.items || []),
            {
              id: orderItem.id,
              quantity: orderItem.quantity,
              unit_price: orderItem.unit_price,
              product: {
                code: orderItem.product?.code || '',
                name: orderItem.product?.name || '',
                unit: orderItem.product?.unit || 'adet',
              },
              currency: orderItem.currency,
              deliveries: orderItem.deliveries || [],
            },
          ]
        }
      }

      const customOrderItem = item.customOrderItem
      if (customOrderItem?.order_id) {
        if (!orderMap.has(customOrderItem.order_id)) {
          // Custom item without order loaded - create minimal order entry
          orderMap.set(customOrderItem.order_id, {
            id: customOrderItem.order_id,
            customer_id: delivery.customer.id,
            order_number: '',
            status: 'OPEN',
            customItems: [],
          })
        }

        const mapOrder = orderMap.get(customOrderItem.order_id)!
        if (!mapOrder.customItems?.some((i) => i.id === customOrderItem.id)) {
          mapOrder.customItems = [
            ...(mapOrder.customItems || []),
            {
              id: customOrderItem.id,
              quantity: customOrderItem.quantity || 1,
              unit_price: customOrderItem.unit_price || 0,
              custom_code: customOrderItem.name || '',
              custom_name: customOrderItem.name || '',
              unit: customOrderItem.unit,
              currency: customOrderItem.currency,
              deliveries: [],
            },
          ]
        }
      }
    })

    return Array.from(orderMap.values())
  }, [deliveryId, availableOrders, delivery.items, delivery.customer.id])

  const handleEditClose = () => {
    setIsEditing(false)
  }

  const totalItems = delivery.items.length
  const totalDeliveredQuantity = delivery.items.reduce(
    (sum, item) => sum + item.delivered_quantity,
    0,
  )

  const pageCurrency =
    delivery.items[0]?.orderItem?.currency ??
    delivery.items[0]?.customOrderItem?.currency ??
    'TRY'

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('deliveries.detail_page_title')}
        actions={
          <Button
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2 w-full sm:w-auto"
          >
            <Edit className="size-4" />
            {t('actions.edit')}
          </Button>
        }
      />

      <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm space-y-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <InfoIcon className="size-5 sm:size-6" />
            {t('deliveries.card_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-4 flex-1">
            <DetailItem
              icon={ReceiptText}
              label={t('deliveries.fields.delivery_number')}
              value={delivery.delivery_number}
              highlight
            />
            <DetailItem
              icon={Calendar}
              label={t('deliveries.fields.delivery_date')}
              value={new Date(delivery.delivery_date).toLocaleDateString(
                i18n.language,
              )}
              highlight
            />
            <DetailItem
              icon={UserRound}
              label={t('orders.fields.customer')}
              value={delivery.customer.name}
              highlight
            />
            <DetailItem
              icon={CoinsIcon}
              label={t('orders.fields.currency')}
              value={pageCurrency}
              highlight
            />
            <DetailItem
              icon={Truck}
              label={t('deliveries.fields.notes')}
              value={delivery.notes}
            />
          </div>

          <div className="flex flex-col gap-4 border-t pt-4 md:border-none md:pt-0 md:min-w-45 md:items-end">
            <div className="flex flex-col md:items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('deliveries.summary_total')}
              </span>
              <Separator />
              <span className="text-xl sm:text-2xl font-bold text-primary">
                {convertToCurrencyFormat({
                  cents: delivery.total_amount * 100,
                  currency: pageCurrency,
                  locale: i18n.language,
                })}
              </span>
            </div>
            <div className="flex gap-6">
              <StatBlock
                label={t('deliveries.summary_items')}
                value={totalItems}
              />
              <StatBlock
                label={t('deliveries.summary_quantity')}
                value={totalDeliveredQuantity}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {t('deliveries.items_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryItemList delivery={delivery} />
        </CardContent>
      </Card>

      {isEditing && (
        <DeliveryForm
          item={delivery}
          orders={orders}
          onClose={handleEditClose}
        />
      )}
    </div>
  )
}

function parseDeliveryId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function redirectToDeliveries() {
  return redirect({
    to: '/deliveries',
    search: {
      pageIndex: 0,
      pageSize: 100,
      sortBy: 'delivery_date',
      sortDir: 'desc',
    },
  })
}

function DetailItem({
  children,
  label,
  value,
  icon: Icon,
  className,
  highlight,
}: PropsWithChildren & {
  label: string
  value?: string | number | null
  icon: ElementType
  className?: string
  highlight?: boolean
}) {
  const { t } = useTranslation('details')

  return (
    <div className={cn('flex flex-col gap-1 min-w-0', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" />

        <span className="text-[10px] font-semibold uppercase tracking-wide truncate">
          {label}
        </span>
      </div>

      <div
        className={cn(
          'text-sm wrap-break-word',
          highlight && 'text-primary font-bold text-base',
        )}
      >
        {(children ?? (value != '' && value != null)) ? (
          value
        ) : (
          <span className="italic text-muted-foreground/50">
            {t('common.empty')}
          </span>
        )}
      </div>
    </div>
  )
}

function StatBlock({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase text-muted-foreground">
        {label}
      </span>

      <Separator />

      <span
        className={cn('font-semibold text-center', highlight && 'text-primary')}
      >
        {value}
      </span>
    </div>
  )
}
