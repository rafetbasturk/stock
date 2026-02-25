import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {  useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  CoinsIcon,
  Edit,
  InfoIcon,
  MapPin,
  ReceiptText,
  Truck,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import type {ElementType, PropsWithChildren} from 'react';

import { convertToCurrencyFormat } from '@/lib/currency'
import { formatDateTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import { orderDeliveriesQuery, orderQuery } from '@/lib/queries/orders'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import OrderForm from '@/components/orders/OrderForm'
import OrderItemList from '@/components/orders/order-detail/OrderItemList'
import OrderDeliveryList from '@/components/orders/order-detail/deliveries/OrderDeliveryList'
import CustomOrderDeliveryList from '@/components/orders/order-detail/deliveries/CustomOrderDeliveryList'
import { useAppTimeZone } from '@/hooks/useAppTimeZone'

export const Route = createFileRoute('/orders/$id')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const orderId = parseOrderId(params.id)

    if (orderId === null) {
      throw redirectToOrders()
    }

    await Promise.all([
      context.queryClient.ensureQueryData(orderQuery(orderId)),
      context.queryClient.ensureQueryData(orderDeliveriesQuery(orderId)),
    ])
  },
})

function RouteComponent() {
  const { t, i18n } = useTranslation('details')
  const timeZone = useAppTimeZone()
  const { id } = Route.useParams()
  const orderId = parseOrderId(id)
  const navigate = Route.useNavigate()

  if (orderId === null) {
    throw redirectToOrders()
  }

  const { data: order } = useSuspenseQuery(orderQuery(orderId))
  const { data: deliveries } = useSuspenseQuery(orderDeliveriesQuery(orderId))

  const [isEditing, setIsEditing] = useState(false)
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<number | null>(
    null,
  )

  if (!order) {
    throw redirectToOrders()
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    toast.success(t('orders.updated_success'))
  }

  const totalLines = order.items.length + order.customItems.length

  const totalFormatted = convertToCurrencyFormat({
    cents: order.total_amount * 100,
    currency: order.currency ?? 'TRY',
    locale: i18n.language,
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={t('orders.detail_page_title')}
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

      {/* Order Info Card */}
      <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm space-y-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <InfoIcon className="size-5 sm:size-6" />
            {t('orders.card_title')}
          </CardTitle>

          <StatusBadge status={order.status} className="px-6 py-2 text-xs" />
        </CardHeader>

        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-4 flex-1">
            <DetailItem
              icon={ReceiptText}
              label={t('orders.fields.order_number')}
              value={order.order_number}
              highlight
            />

            <DetailItem
              icon={Calendar}
              label={t('orders.fields.order_date')}
              value={formatDateTime(order.order_date, {
                locale: i18n.language,
                timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
              highlight
            />

            <DetailItem
              icon={UserRound}
              label={t('orders.fields.customer')}
              value={order.customer.name}
              highlight
            />

            <DetailItem
              icon={MapPin}
              label={t('orders.fields.delivery_address')}
              value={order.delivery_address}
              highlight
            />

            <DetailItem
              icon={CoinsIcon}
              label={t('orders.fields.currency')}
              value={order.currency}
              highlight
            />
          </div>

          <div className="flex flex-col gap-4 border-t pt-4 md:border-none md:pt-0 md:min-w-45 md:items-end">
            {/* Total amount */}
            <div className="flex flex-col md:items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('orders.totals.total')}
              </span>
              <Separator />
              <span className="text-xl sm:text-2xl font-bold text-primary">
                {totalFormatted}
              </span>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <StatBlock label={t('orders.summary.items')} value={totalLines} />

              <StatBlock
                label={t('orders.summary.shipments')}
                value={deliveries.length}
                highlight
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <OrderItemList
        order={order}
        deliveries={deliveries}
        t={t}
        onProductClick={(productId) =>
          navigate({
            to: '/products/$id',
            params: { id: String(productId) },
          })
        }
      />

      {deliveries.length > 0 && (
        <Card className="border-l-4 border-l-primary shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Truck className="size-5 text-warning" />
              {t('orders.deliveries_title', {
                defaultValue: 'Deliveries',
              })}
              <span className="ml-2 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">
                {deliveries.length}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y border-t">
              {deliveries.map((delivery) => {
                const isExpanded = expandedDeliveryId === delivery.id
                const currency =
                  delivery.items[0]?.orderItem?.currency ??
                  delivery.items[0]?.customOrderItem?.currency ??
                  order.currency ??
                  'TRY'

                const total = convertToCurrencyFormat({
                  cents: delivery.total_amount * 100,
                  currency,
                  locale: i18n.language,
                })

                return (
                  <div key={delivery.id} className="group">
                    {/* Accordion Header */}
                    <button
                      onClick={() =>
                        setExpandedDeliveryId(isExpanded ? null : delivery.id)
                      }
                      className={cn(
                        'flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50',
                        isExpanded && 'bg-muted/30',
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/15 text-warning transition-colors group-hover:bg-warning/25">
                          {isExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm sm:text-base">
                            {delivery.delivery_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(delivery.delivery_date, {
                              locale: i18n.language,
                              timeZone,
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                            {t('orders.delivery_items_label', {
                              defaultValue: 'Items',
                            })}
                          </p>
                          <p className="font-medium text-sm">
                            {delivery.items.length}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                            {t('orders.totals.total')}
                          </p>
                          <p className="font-bold text-warning">{total}</p>
                        </div>
                      </div>
                    </button>

                    {/* Accordion Content */}
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-200 ease-in-out',
                        isExpanded ? 'max-h-250 border-t' : 'max-h-0',
                      )}
                    >
                      <div className="p-4 bg-muted/10">
                        {order.is_custom_order ? (
                          <CustomOrderDeliveryList
                            delivery={delivery}
                            order={order}
                          />
                        ) : (
                          <OrderDeliveryList
                            delivery={delivery}
                            order={order}
                          />
                        )}

                        {delivery.notes && (
                          <div className="mt-4 rounded-md bg-warning/10 p-3 border border-warning/30">
                            <p className="text-xs font-semibold text-warning uppercase tracking-wider mb-1">
                              {t('orders.fields.notes', {
                                defaultValue: 'Notes',
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground italic">
                              {delivery.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isEditing && (
        <OrderForm
          item={order}
          onClose={() => setIsEditing(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
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
        {children ?? value ?? (
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

function parseOrderId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function redirectToOrders() {
  return redirect({
    to: '/orders',
    search: {
      pageIndex: 0,
      pageSize: 100,
      sortBy: 'order_date',
      sortDir: 'desc',
    },
  })
}
