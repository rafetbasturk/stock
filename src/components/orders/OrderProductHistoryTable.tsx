import { CheckCircle, Clock } from 'lucide-react'
import type { OrderListRow } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useAppTimeZone } from '@/hooks/useAppTimeZone'
import { formatDateTime } from '@/lib/datetime'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function OrderProductHistoryTable({ order }: { order: OrderListRow }) {
  const { i18n } = useTranslation()
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

  return (
    <div
      className={cn(
        'overflow-hidden border rounded-md m-2 shadow-inner',
        'bg-background border-border',
        'transition-all duration-300 animate-accordion-down',
      )}
    >
      <h3 className="text-base font-semibold px-4 pt-4 text-foreground">
        Sipariş Ürün Detayları
      </h3>

      <div className="max-h-100 overflow-y-auto overflow-x-auto rounded animate-in delay-100 duration-300 m-2 border">
        <Table className="w-full table-auto border">
          <TableHeader>
            <TableRow className="bg-muted text-muted-foreground text-xs capitalize">
              <TableHead className="min-w-35">Durum</TableHead>
              <TableHead className="min-w-45">Ürün</TableHead>
              <TableHead className="text-center min-w-17.5">Sipariş</TableHead>
              <TableHead className="text-center min-w-22.5">Sevk</TableHead>
              <TableHead className="text-center min-w-22.5">Kalan</TableHead>
              <TableHead className="min-w-65">Sevkiyat Geçmişi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {allItems.map((item) => {
              const productCode =
                'product' in item ? item.product.code : item.name
              const productName = 'product' in item ? item.product.name : null

              const qty = item.quantity ?? 0
              const pastDeliveries = (
                'deliveries' in item ? item.deliveries : []
              ) as Array<DeliveryHistory>
              const signedQty = (d: DeliveryHistory) =>
                d.delivery?.kind === 'RETURN'
                  ? -d.delivered_quantity
                  : d.delivered_quantity
              const delivered = pastDeliveries.reduce(
                (s, d) => s + signedQty(d),
                0,
              )

              const remaining = qty - delivered
              const progress =
                qty > 0
                  ? Math.max(0, Math.min((delivered / qty) * 100, 100))
                  : 0

              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    'text-sm border-b border-border transition-colors hover:bg-accent/90',
                    remaining <= 0 && 'bg-green-500/5 dark:bg-green-400/10',
                  )}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-medium text-green-700 dark:text-green-400">
                          %{progress.toFixed(0)}
                        </span>

                        <span
                          className={cn(
                            'flex items-center gap-1 font-medium',
                            remaining > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-muted-foreground',
                          )}
                        >
                          {remaining > 0 ? (
                            <>
                              <Clock className="w-3 h-3" />
                              {remaining} eksik
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                              Tamamlandı
                            </>
                          )}
                        </span>
                      </div>

                      <div className="h-2 w-full rounded bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded transition-all',
                            remaining > 0
                              ? 'bg-green-600 dark:bg-green-500'
                              : 'bg-green-500 dark:bg-green-400',
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium text-foreground">
                      {productCode}
                    </div>
                    {productName && (
                      <div className="text-xs text-muted-foreground">
                        {productName}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-center text-foreground">
                    {qty}
                  </TableCell>

                  <TableCell
                    className={cn(
                      'text-center font-semibold',
                      delivered < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400',
                    )}
                  >
                    {delivered}
                  </TableCell>

                  <TableCell
                    className={cn(
                      'text-center font-medium',
                      remaining > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    {remaining}
                  </TableCell>

                  <TableCell>
                    {pastDeliveries.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {pastDeliveries.map((d) => (
                          <Badge
                            key={d.id}
                            variant="secondary"
                            className="text-[11px] px-2 py-0.5 w-fit"
                          >
                            {formatDateTime(d.delivery.delivery_date, {
                              locale: i18n.language,
                              timeZone,
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })}
                            {' — '}
                            {d.delivery.delivery_number} —{' '}
                            {signedQty(d) > 0 ? '+' : ''}
                            {signedQty(d)} adet
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Henüz sevk yapılmadı
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}

            {!allItems.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Bu siparişe ait ürün bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
