import { CheckCircle, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { OrderListRow } from '@/types'
import { cn } from '@/lib/utils'
import { useAppTimeZone } from '@/hooks/useAppTimeZone'
import { formatDateTime } from '@/lib/datetime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function OrderProductHistoryTable({ order }: { order: OrderListRow }) {
  const { i18n, t } = useTranslation('entities')
  const timeZone = useAppTimeZone()

  type DeliveryHistory = {
    id: number
    delivered_quantity: number
    delivery: {
      delivery_number: string
      delivery_date: Date
      kind?: 'DELIVERY' | 'RETURN'
    }
  }

  const allItems = [...order.items, ...order.customItems]
  const preparedItems = allItems.map((item) => {
    const productCode = 'product' in item ? item.product.code : item.name
    const productName = 'product' in item ? item.product.name : null
    const qty = item.quantity

    const pastDeliveries = (
      'deliveries' in item ? item.deliveries : []
    ) as Array<DeliveryHistory>

    const signedQty = (d: DeliveryHistory) =>
      d.delivery.kind === 'RETURN'
        ? -d.delivered_quantity
        : d.delivered_quantity

    const delivered = pastDeliveries.reduce((s, d) => s + signedQty(d), 0)
    const remaining = qty - delivered
    const progress =
      qty > 0 ? Math.max(0, Math.min((delivered / qty) * 100, 100)) : 0

    return {
      id: item.id,
      productCode,
      productName,
      qty,
      delivered,
      remaining,
      progress,
      pastDeliveries,
      signedQty,
    }
  })

  return (
    <div
      className={cn(
        'overflow-hidden shadow-inner',
        'bg-background',
        'transition-all duration-300 animate-accordion-down',
      )}
    >
      <h3 className="text-base font-semibold px-2 pt-4 text-foreground">
        {t('orders.history.title')}
      </h3>

      <div className="hidden md:block max-h-100 overflow-y-auto overflow-x-auto rounded animate-in delay-100 duration-300 m-2 border">
        <Table className="w-full table-auto border">
          <TableHeader>
            <TableRow className="bg-muted text-muted-foreground text-xs capitalize">
              <TableHead className="min-w-35">
                {t('orders.history.columns.status')}
              </TableHead>
              <TableHead className="min-w-45">
                {t('orders.history.columns.product')}
              </TableHead>
              <TableHead className="text-center min-w-17.5">
                {t('orders.history.columns.ordered')}
              </TableHead>
              <TableHead className="text-center min-w-22.5">
                {t('orders.history.columns.delivered')}
              </TableHead>
              <TableHead className="text-center min-w-22.5">
                {t('orders.history.columns.remaining')}
              </TableHead>
              <TableHead className="min-w-65">
                {t('orders.history.columns.shipment_history')}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {preparedItems.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  'text-sm border-b border-border transition-colors hover:bg-accent/90',
                  item.remaining <= 0 && 'bg-green-500/5 dark:bg-green-400/10',
                )}
              >
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
                            {t('orders.history.status.missing', {
                              count: item.remaining,
                            })}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                            {t('orders.history.status.completed')}
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
                  <div className="font-medium text-foreground">
                    {item.productCode}
                  </div>
                  {item.productName && (
                    <div className="text-xs text-muted-foreground">
                      {item.productName}
                    </div>
                  )}
                </TableCell>

                <TableCell className="text-center text-foreground">
                  {item.qty}
                </TableCell>

                <TableCell
                  className={cn(
                    'text-center font-semibold',
                    item.delivered < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400',
                  )}
                >
                  {item.delivered}
                </TableCell>

                <TableCell
                  className={cn(
                    'text-center font-medium',
                    item.remaining > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.remaining}
                </TableCell>

                <TableCell>
                  {item.pastDeliveries.length > 0 ? (
                    <div className="space-y-1">
                      {item.pastDeliveries.map((d) => (
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
                              item.signedQty(d) < 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400',
                            )}
                          >
                            {d.delivery.kind === 'RETURN' ? '+' : '-'}
                            {d.delivered_quantity}{' '}
                            {t('orders.history.qty_suffix')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('orders.history.none')}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {!preparedItems.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t('orders.history.empty')}
                </TableCell>
              </TableRow>
            )}
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
                <p className="font-medium text-sm text-foreground">
                  {item.productCode}
                </p>
                {item.productName && (
                  <p className="text-xs text-muted-foreground">
                    {item.productName}
                  </p>
                )}
              </div>

              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  item.remaining > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400',
                )}
              >
                {item.remaining > 0 ? (
                  <>
                    <Clock className="h-3 w-3" />
                    {t('orders.history.status.missing', {
                      count: item.remaining,
                    })}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    {t('orders.history.status.completed')}
                  </>
                )}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t('orders.history.progress')}
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
                  {t('orders.history.columns.ordered')}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {item.qty}
                </p>
              </div>
              <div className="rounded-md border bg-muted/20 py-1.5">
                <p className="text-[11px] text-muted-foreground">
                  {t('orders.history.columns.delivered')}
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    item.delivered < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400',
                  )}
                >
                  {item.delivered}
                </p>
              </div>
              <div className="rounded-md border bg-muted/20 py-1.5">
                <p className="text-[11px] text-muted-foreground">
                  {t('orders.history.columns.remaining')}
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    item.remaining > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.remaining}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t('orders.history.columns.shipment_history')}
              </p>
              {item.pastDeliveries.length > 0 ? (
                <div className="space-y-1.5">
                  {item.pastDeliveries.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-md border bg-muted/20 px-2.5 py-1.5 text-[11px] flex items-center justify-between gap-2"
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
                          item.signedQty(d) < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400',
                        )}
                      >
                        {item.signedQty(d) > 0 ? '+' : ''}
                        {item.signedQty(d)} {t('orders.history.qty_suffix')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t('orders.history.none')}
                </p>
              )}
            </div>
          </div>
        ))}

        {!preparedItems.length && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t('orders.history.empty')}
          </div>
        )}
      </div>
    </div>
  )
}
