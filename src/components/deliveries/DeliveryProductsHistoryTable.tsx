import { CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DeliveryWithItems } from '@/types'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppTimeZone } from '@/hooks/useAppTimeZone'
import { formatDateTime } from '@/lib/datetime'

export function DeliveryProductsHistoryTable({
  delivery,
}: {
  delivery: DeliveryWithItems
}) {
  const { i18n, t } = useTranslation('entities')
  const timeZone = useAppTimeZone()
  const isReturn = delivery.kind === 'RETURN'

  type DeliveryHistory = {
    id: number
    delivered_quantity: number
    delivery: {
      id?: number
      delivery_number: string
      delivery_date: Date
      kind?: 'DELIVERY' | 'RETURN'
    }
  }

  const preparedItems = delivery.items.map((item, index) => {
    const productCode =
      item.orderItem?.product?.code ?? item.customOrderItem?.name ?? '-'
    const productName =
      item.orderItem?.product?.name ?? item.customOrderItem?.name ?? '-'
    const orderNumber =
      (item.orderItem as any)?.order?.order_number ??
      (item.customOrderItem as any)?.order?.order_number ??
      '-'
    const ordered = item.orderItem?.quantity ?? item.customOrderItem?.quantity ?? 0

    const histories = (
      ((item.orderItem as any)?.deliveries ??
        (item.customOrderItem as any)?.deliveries ??
        []) as Array<DeliveryHistory>
    ).filter((d) => d.delivery.delivery_number !== delivery.delivery_number)

    const signedQty = (d: DeliveryHistory) =>
      d.delivery?.kind === 'RETURN' ? -d.delivered_quantity : d.delivered_quantity

    const historicalDelivered = histories.reduce((sum, d) => sum + signedQty(d), 0)
    const currentSigned = isReturn ? -item.delivered_quantity : item.delivered_quantity
    const deliveredTotal = historicalDelivered + currentSigned
    const remaining = ordered - deliveredTotal
    const progress =
      ordered > 0 ? Math.max(0, Math.min((deliveredTotal / ordered) * 100, 100)) : 0

    return {
      id: item.id,
      index,
      productCode,
      productName,
      orderNumber,
      ordered,
      deliveredTotal,
      currentSigned,
      remaining,
      progress,
      histories,
      signedQty,
    }
  })

  return (
    <div
      className={cn(
        'overflow-hidden shadow-inner',
        'bg-background border rounded-md m-2',
        'animate-accordion-down duration-300',
      )}
    >
      <h3 className="text-base font-semibold px-4 pt-4 text-foreground">
        {t('deliveries.history.title')}
      </h3>

      <div className="hidden md:block max-h-100 overflow-y-auto overflow-x-auto rounded animate-in delay-100 duration-300 m-2 border">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow className="bg-muted text-muted-foreground text-xs capitalize">
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead className="min-w-30">
                {t('deliveries.history.columns.order_number')}
              </TableHead>
              <TableHead className="min-w-40">
                {t('deliveries.history.columns.product')}
              </TableHead>
              <TableHead className="text-center min-w-17.5">
                {t('deliveries.history.columns.ordered')}
              </TableHead>
              <TableHead className="text-center min-w-22.5">
                {t('deliveries.history.columns.total_delivered')}
              </TableHead>
              <TableHead className="text-center min-w-17.5 text-blue-700 dark:text-blue-400">
                {t('deliveries.history.columns.current_delivery')}
              </TableHead>
              <TableHead className="text-center min-w-21.25">
                {t('deliveries.history.columns.status')}
              </TableHead>
              <TableHead className="min-w-60">
                {t('deliveries.history.columns.shipment_history')}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {preparedItems.map((item) => {
              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    'text-sm border-b border-border transition-colors hover:bg-accent/90',
                    item.remaining <= 0 && 'bg-green-500/5 dark:bg-green-400/10',
                  )}
                >
                  <TableCell className="text-center font-medium text-foreground">
                    {item.index + 1}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {item.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{item.productCode}</div>
                    <div className="text-xs text-muted-foreground">{item.productName}</div>
                  </TableCell>

                  <TableCell className="text-center text-foreground">
                    {item.ordered}
                  </TableCell>

                  <TableCell
                    className={cn(
                      'text-center font-semibold',
                      item.deliveredTotal < 0
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-green-700 dark:text-green-400',
                    )}
                  >
                    {item.deliveredTotal}
                  </TableCell>

                  <TableCell className="text-center font-semibold text-blue-700 dark:text-blue-400">
                    {item.currentSigned}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-medium text-green-700 dark:text-green-400">
                          %{item.progress.toFixed(0)}
                        </span>

                        <span
                          className={cn(
                            'flex items-center gap-1 font-medium',
                            item.remaining > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-muted-foreground',
                          )}
                        >
                          {item.remaining > 0 ? (
                            <>
                              <Clock className="w-3 h-3" />
                              {t('deliveries.history.status.missing', {
                                count: item.remaining,
                              })}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                              {t('deliveries.history.status.completed')}
                            </>
                          )}
                        </span>
                      </div>

                      <div className="h-2 w-full rounded bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded transition-all',
                            item.remaining > 0
                              ? 'bg-green-600 dark:bg-green-500'
                              : 'bg-green-500 dark:bg-green-400',
                          )}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {item.histories.length ? (
                        item.histories.map((d) => (
                          <div
                            key={d.id}
                            className="rounded-md border bg-muted/20 px-2 py-1 text-[11px] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-muted-foreground">
                                {formatDateTime(d.delivery.delivery_date, {
                                  locale: i18n.language,
                                  timeZone,
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                })}
                              </p>
                              <p className="truncate text-foreground">
                                {d.delivery.delivery_number}
                              </p>
                            </div>
                            <p
                              className={cn(
                                'font-semibold shrink-0',
                                d.delivery.kind === 'RETURN'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-green-600 dark:text-green-400',
                              )}
                            >
                              {Math.abs(item.signedQty(d))}{' '}
                              {t('deliveries.history.qty_suffix')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t('deliveries.history.none')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden m-2 space-y-3">
        {preparedItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-lg border p-3 bg-background space-y-3',
              item.remaining <= 0 && 'bg-green-500/5 dark:bg-green-400/10',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm text-foreground">{item.productCode}</p>
                <p className="text-xs text-muted-foreground">{item.productName}</p>
              </div>
              <span className="rounded-md border bg-muted/20 px-2 py-1 text-[11px] font-medium text-foreground">
                {item.orderNumber}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t('deliveries.history.progress')}
                </span>
                <span className="font-medium text-green-700 dark:text-green-400">
                  %{item.progress.toFixed(0)}
                </span>
              </div>
              <div className="h-2 w-full rounded bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded transition-all',
                    item.remaining > 0
                      ? 'bg-green-600 dark:bg-green-500'
                      : 'bg-green-500 dark:bg-green-400',
                  )}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border bg-muted/20 py-1.5">
                <p className="text-[11px] text-muted-foreground">
                  {t('deliveries.history.columns.ordered')}
                </p>
                <p className="text-sm font-semibold text-foreground">{item.ordered}</p>
              </div>
              <div className="rounded-md border bg-muted/20 py-1.5">
                <p className="text-[11px] text-muted-foreground">
                  {t('deliveries.history.columns.total_delivered')}
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    item.deliveredTotal < 0
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-green-700 dark:text-green-400',
                  )}
                >
                  {item.deliveredTotal}
                </p>
              </div>
              <div className="rounded-md border bg-muted/20 py-1.5">
                <p className="text-[11px] text-muted-foreground">
                  {t('deliveries.history.columns.current_delivery')}
                </p>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {item.currentSigned}
                </p>
              </div>
            </div>

            <div
              className={cn(
                'text-xs font-medium flex items-center gap-1',
                item.remaining > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400',
              )}
            >
              {item.remaining > 0 ? (
                <>
                  <Clock className="h-3 w-3" />
                  {t('deliveries.history.status.missing', {
                    count: item.remaining,
                  })}
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3" />
                  {t('deliveries.history.status.completed')}
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t('deliveries.history.columns.shipment_history')}
              </p>
              {item.histories.length ? (
                item.histories.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-md border bg-muted/20 px-2 py-1 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-muted-foreground">
                        {formatDateTime(d.delivery.delivery_date, {
                          locale: i18n.language,
                          timeZone,
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </p>
                      <p className="truncate text-foreground">{d.delivery.delivery_number}</p>
                    </div>
                    <p
                      className={cn(
                        'font-semibold shrink-0',
                        d.delivery.kind === 'RETURN'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400',
                      )}
                    >
                      {Math.abs(item.signedQty(d))} {t('deliveries.history.qty_suffix')}
                    </p>
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t('deliveries.history.none')}
                </span>
              )}
            </div>
          </div>
        ))}

        {!preparedItems.length && (
          <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            {t('deliveries.history.empty')}
          </div>
        )}
      </div>
    </div>
  )
}
