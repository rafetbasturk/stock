import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Calendar, Package, ReceiptText, Truck, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ElementType } from 'react'
import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { convertToCurrencyFormat } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { deliveryQuery } from '@/lib/queries/deliveries'

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

  const { data: delivery } = useSuspenseQuery(deliveryQuery(deliveryId))

  if (!delivery) {
    throw redirectToDeliveries()
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
      <PageHeader title={delivery.delivery_number} description={delivery.customer.name} />

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('deliveries.card_title')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="px-2.5 py-1">{delivery.delivery_number}</Badge>
                <Badge variant="outline" className="px-2.5 py-1">
                  {new Date(delivery.delivery_date).toLocaleDateString(i18n.language)}
                </Badge>
                <Badge variant="secondary" className="px-2.5 py-1">
                  {totalItems} {t('deliveries.summary_items')}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border bg-background/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('deliveries.summary_total')}
              </p>
              <p className="mt-1 text-2xl font-semibold leading-none text-foreground">
                {convertToCurrencyFormat({
                  cents: delivery.total_amount * 100,
                  currency: pageCurrency,
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
            <CardTitle className="text-lg">{t('deliveries.card_title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              icon={ReceiptText}
              label={t('deliveries.fields.delivery_number')}
              value={delivery.delivery_number}
            />
            <DetailItem
              icon={UserRound}
              label={t('deliveries.fields.customer')}
              value={delivery.customer.name}
            />
            <DetailItem
              icon={Calendar}
              label={t('deliveries.fields.delivery_date')}
              value={new Date(delivery.delivery_date).toLocaleDateString(i18n.language)}
            />
            <DetailItem
              icon={Truck}
              label={t('deliveries.fields.notes')}
              value={delivery.notes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('deliveries.summary_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label={t('deliveries.summary_items')} value={String(totalItems)} />
            <SummaryRow
              label={t('deliveries.summary_quantity')}
              value={String(totalDeliveredQuantity)}
            />
            <Separator />
            <SummaryRow
              label={t('deliveries.summary_total')}
              value={convertToCurrencyFormat({
                cents: delivery.total_amount * 100,
                currency: pageCurrency,
                locale: i18n.language,
              })}
              valueClassName="text-base font-semibold"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('deliveries.items_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 w-[34%] px-4 text-left font-medium text-muted-foreground">
                    {t('deliveries.items_headers.item')}
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                    {t('deliveries.items_headers.order')}
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                    {t('deliveries.items_headers.quantity')}
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                    {t('deliveries.items_headers.unit_price')}
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                    {t('deliveries.items_headers.total')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {delivery.items.map((item) => {
                  const orderSource = item.orderItem ?? item.customOrderItem
                  const orderId = orderSource?.order_id
                  const orderNumber = orderSource?.order.order_number
                  const orderCurrency = orderSource?.currency ?? 'TRY'
                  const itemName = item.orderItem?.product.name ?? item.customOrderItem?.name
                  const itemCode = item.orderItem?.product.code
                  const unit = item.orderItem?.product.unit ?? item.customOrderItem?.unit ?? 'adet'
                  const unitPrice = orderSource?.unit_price ?? 0
                  const lineTotal = item.delivered_quantity * unitPrice

                  return (
                    <tr key={item.id}>
                      <td className="p-4 align-middle">
                        <div className="font-medium">{itemName || t('common.empty')}</div>
                        {itemCode && (
                          <div className="text-xs text-muted-foreground">{itemCode}</div>
                        )}
                      </td>

                      <td className="p-4 align-middle">
                        {orderId && orderNumber ? (
                          <Link
                            to="/orders/$id"
                            params={{ id: String(orderId) }}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            <Package className="size-3.5" />
                            {orderNumber}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{t('common.empty')}</span>
                        )}
                      </td>

                      <td className="p-4 text-right align-middle">
                        {item.delivered_quantity} {unit}
                      </td>

                      <td className="p-4 text-right align-middle">
                        {convertToCurrencyFormat({
                          cents: unitPrice,
                          currency: orderCurrency,
                          locale: i18n.language,
                        })}
                      </td>

                      <td className="p-4 text-right align-middle font-medium">
                        {convertToCurrencyFormat({
                          cents: lineTotal,
                          currency: orderCurrency,
                          locale: i18n.language,
                        })}
                      </td>
                    </tr>
                  )
                })}

                {delivery.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      {t('common.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-muted/50 font-medium">
                <tr>
                  <td colSpan={4} className="p-4 text-right">
                    {t('deliveries.summary_total')}
                  </td>
                  <td className="p-4 text-right text-base">
                    {convertToCurrencyFormat({
                      cents: delivery.total_amount * 100,
                      currency: pageCurrency,
                      locale: i18n.language,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
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
            <span className="text-muted-foreground/40">{t('common.empty')}</span>
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
      <span className={cn('text-sm font-medium text-foreground', valueClassName)}>{value}</span>
    </div>
  )
}
