import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Calendar,
  Edit,
  ListTodo,
  MapPin,
  ReceiptText,
  Truck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ElementType } from 'react'
import OrderForm from '@/components/orders/OrderForm'
import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { convertToCurrencyFormat } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { orderDeliveriesQuery, orderQuery } from '@/lib/queries/orders'

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
  const { id } = Route.useParams()
  const orderId = parseOrderId(id)

  if (orderId === null) {
    throw redirectToOrders()
  }

  const { data: order } = useSuspenseQuery(orderQuery(orderId))
  const { data: deliveries } = useSuspenseQuery(orderDeliveriesQuery(orderId))
  const [isEditing, setIsEditing] = useState(false)

  if (!order) {
    throw redirectToOrders()
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    toast.success(t('orders.updated_success'))
  }

  const totalItems = order.items.length + order.customItems.length
  const totalDeliveredQuantity = deliveries.reduce(
    (sum, delivery) =>
      sum +
      delivery.items.reduce(
        (inner, item) => inner + item.delivered_quantity,
        0,
      ),
    0,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.order_number}
        description={order.customer.name}
        actions={
          <Button
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit className="size-4" />
            {t('actions.edit')}
          </Button>
        }
      />

      <Card className="overflow-hidden border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('orders.card_title')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn('px-2.5 py-1', statusBadgeClass(order.status))}
                >
                  {order.status}
                </Badge>
                <Badge variant="outline" className="px-2.5 py-1">
                  {order.currency || 'TRY'}
                </Badge>
                {deliveries.length > 0 && (
                  <Badge variant="secondary" className="px-2.5 py-1">
                    {deliveries.length}{' '}
                    {t('orders.deliveries_count', {
                      defaultValue:
                        deliveries.length > 1 ? 'deliveries' : 'delivery',
                    })}
                  </Badge>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-background/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('orders.totals.total')}
              </p>
              <p className="mt-1 text-2xl font-semibold leading-none text-foreground">
                {convertToCurrencyFormat({
                  cents: order.total_amount * 100,
                  currency: order.currency || 'TRY',
                  locale: i18n.language,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t('orders.card_title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              icon={ReceiptText}
              label={t('orders.fields.order_number')}
              value={order.order_number}
            />
            <DetailItem
              icon={UserRound}
              label={t('orders.fields.customer')}
              value={order.customer.name}
            />
            <DetailItem
              icon={ListTodo}
              label={t('orders.fields.status')}
              value={order.status}
            />
            <DetailItem
              icon={ReceiptText}
              label={t('orders.fields.currency')}
              value={order.currency}
            />
            <DetailItem
              icon={Calendar}
              label={t('orders.fields.order_date')}
              value={new Date(order.order_date).toLocaleDateString(
                i18n.language,
              )}
            />
            <DetailItem
              icon={MapPin}
              label={t('orders.fields.delivery_address')}
              value={order.delivery_address}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('orders.summary.title', { defaultValue: 'Summary' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow
              label={t('orders.summary.items', { defaultValue: 'Order items' })}
              value={String(totalItems)}
            />
            <SummaryRow
              label={t('orders.summary.shipments', {
                defaultValue: 'Shipments',
              })}
              value={String(deliveries.length)}
            />
            <SummaryRow
              label={t('orders.summary.delivered_quantity', {
                defaultValue: 'Delivered quantity',
              })}
              value={String(totalDeliveredQuantity)}
            />
            <Separator />
            <SummaryRow
              label={t('orders.totals.total')}
              value={convertToCurrencyFormat({
                cents: order.total_amount * 100,
                currency: order.currency || 'TRY',
                locale: i18n.language,
              })}
              valueClassName="text-base font-semibold"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('orders.items_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 w-[40%] px-4 text-left font-medium text-muted-foreground">
                    {t('orders.items_headers.product')}
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                    {t('orders.items_headers.quantity')}
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                    {t('orders.items_headers.unit_price')}
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                    {t('orders.items_headers.total')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-4 align-middle">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.product.code}
                      </div>
                    </td>
                    <td className="p-4 text-right align-middle">
                      {item.quantity} {item.product.unit}
                    </td>
                    <td className="p-4 text-right align-middle">
                      {convertToCurrencyFormat({
                        cents: item.unit_price,
                        currency: item.currency || 'TRY',
                        locale: i18n.language,
                      })}
                    </td>
                    <td className="p-4 text-right align-middle font-medium">
                      {convertToCurrencyFormat({
                        cents: item.quantity * item.unit_price,
                        currency: item.currency || 'TRY',
                        locale: i18n.language,
                      })}
                    </td>
                  </tr>
                ))}
                {order.customItems.map((item) => (
                  <tr key={item.id}>
                    <td className="p-4 align-middle">
                      <div className="font-medium">{item.name}</div>
                      {item.notes && (
                        <div className="text-xs text-muted-foreground">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right align-middle">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-4 text-right align-middle">
                      {convertToCurrencyFormat({
                        cents: item.unit_price,
                        currency: item.currency || 'TRY',
                        locale: i18n.language,
                      })}
                    </td>
                    <td className="p-4 text-right align-middle font-medium">
                      {convertToCurrencyFormat({
                        cents: item.quantity * item.unit_price,
                        currency: item.currency || 'TRY',
                        locale: i18n.language,
                      })}
                    </td>
                  </tr>
                ))}
                {totalItems === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 text-center text-muted-foreground"
                    >
                      {t('common.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-muted/50 font-medium">
                <tr>
                  <td colSpan={3} className="p-4 text-right">
                    {t('orders.totals.total')}
                  </td>
                  <td className="p-4 text-right text-base">
                    {convertToCurrencyFormat({
                      cents: order.total_amount * 100,
                      currency: order.currency || 'TRY',
                      locale: i18n.language,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="size-5 text-primary" />
              {t('orders.deliveries_title', { defaultValue: 'Deliveries' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deliveries.map((delivery) => {
              const deliveryCurrency =
                delivery.items[0]?.orderItem?.currency ??
                delivery.items[0]?.customOrderItem?.currency ??
                order.currency ??
                'TRY'

              return (
                <div
                  key={delivery.id}
                  className="rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {delivery.delivery_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(delivery.delivery_date).toLocaleDateString(
                          i18n.language,
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {convertToCurrencyFormat({
                          cents: delivery.total_amount * 100,
                          currency: deliveryCurrency,
                          locale: i18n.language,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {delivery.items.length}{' '}
                        {t('orders.delivery_items_label', {
                          defaultValue: 'line(s)',
                        })}
                      </p>
                    </div>
                  </div>
                  {delivery.notes && (
                    <p className="mt-2 border-t pt-2 text-sm text-muted-foreground">
                      {delivery.notes}
                    </p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {isEditing && (
        <OrderForm
          item={order}
          isSubmitting={false}
          onClose={() => setIsEditing(false)}
          onSuccess={handleEditSuccess}
        />
      )}
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

function statusBadgeClass(status: string | null | undefined) {
  switch (status) {
    case 'BİTTİ':
      return 'bg-emerald-600 text-white hover:bg-emerald-600'
    case 'İPTAL':
      return 'bg-destructive text-white hover:bg-destructive'
    case 'ÜRETİM':
      return 'bg-amber-500 text-amber-950 hover:bg-amber-500'
    default:
      return 'bg-primary text-primary-foreground hover:bg-primary'
  }
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number | null | undefined
  icon: ElementType
}) {
  const { t } = useTranslation('details')

  return (
    <div className="group flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary/70">
        <Icon className="size-4" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">
          {value || (
            <span className="text-muted-foreground/40">
              {t('common.empty')}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn('text-sm font-medium text-foreground', valueClassName)}
      >
        {value}
      </span>
    </div>
  )
}
