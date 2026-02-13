import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, ArrowRight, PackageSearch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getStockMovements } from '@/server/stock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Props {
  productId: number
}

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVE' | 'RELEASE'

export function StockMovementsTable({ productId }: Props) {
  const [page, setPage] = useState(0)
  const { t, i18n } = useTranslation('stock')

  const query = useQuery({
    queryKey: ['stock-movements', productId, page],
    queryFn: () =>
      getStockMovements({
        data: {
          product_id: productId,
          page,
          pageSize: 20,
        },
      }),
    placeholderData: keepPreviousData,
  })

  const data = query.data
  const movements = data?.data ?? []
  const pageCount = data?.pageCount ?? 0
  const total = data?.total ?? 0

  const movementTypeLabels: Record<MovementType, string> = useMemo(
    () => ({
      IN: t('stock_in'),
      OUT: t('stock_out'),
      ADJUSTMENT: t('adjust_stock'),
      RESERVE: 'Reserve',
      RELEASE: 'Release',
    }),
    [t],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total > 0
            ? `${total} ${t('stock_history').toLocaleLowerCase(i18n.language)}`
            : t('stock_history_desc')}
        </p>

        {query.isFetching && !query.isLoading && (
          <span className="text-xs text-muted-foreground">{t('processing')}</span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="max-h-[62vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead className="text-right">{t('quantity')}</TableHead>
                <TableHead>{t('user')}</TableHead>
                <TableHead>{t('reference')}</TableHead>
                <TableHead>{t('notes')}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {query.isLoading &&
                Array.from({ length: 8 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Skeleton className="h-4 w-14" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                  </TableRow>
                ))}

              {query.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                      <AlertCircle className="size-4" />
                      <span>{t('stock_adjustment_failed')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!query.isLoading && !query.isError && movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <Empty className="border-0 rounded-none py-12">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <PackageSearch />
                        </EmptyMedia>
                        <EmptyTitle>{t('stock_history')}</EmptyTitle>
                        <EmptyDescription>{t('stock_history_desc')}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}

              {!query.isLoading &&
                !query.isError &&
                movements.map((movement) => (
                  <TableRow key={movement.id} className="hover:bg-accent/50">
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(movement.created_at).toLocaleString(i18n.language)}
                    </TableCell>

                    <TableCell>
                      <MovementBadge
                        type={movement.movement_type as MovementType}
                        label={movementTypeLabels[movement.movement_type as MovementType]}
                      />
                    </TableCell>

                    <TableCell className="text-right font-mono font-semibold">
                      <QuantityCell quantity={movement.quantity} />
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {movement.createdBy.username}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {movement.reference_type ? (
                        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                          {movement.reference_type} #{movement.reference_id ?? '-'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>

                    <TableCell className="max-w-[24rem] truncate text-muted-foreground">
                      {movement.notes?.trim() || '-'}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination page={page} pageCount={pageCount} setPage={setPage} />
    </div>
  )
}

function QuantityCell({ quantity }: { quantity: number }) {
  const sign = quantity > 0 ? '+' : ''

  return (
    <span className={cn(quantity > 0 ? 'text-emerald-600' : 'text-red-600')}>
      {sign}
      {quantity}
    </span>
  )
}

function MovementBadge({
  type,
  label,
}: {
  type: MovementType
  label: string
}) {
  const classes: Record<MovementType, string> = {
    IN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    OUT: 'bg-red-100 text-red-700 border-red-200',
    ADJUSTMENT: 'bg-blue-100 text-blue-700 border-blue-200',
    RESERVE: 'bg-amber-100 text-amber-700 border-amber-200',
    RELEASE: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <Badge variant="outline" className={classes[type]}>
      {label}
    </Badge>
  )
}

function Pagination({
  page,
  pageCount,
  setPage,
}: {
  page: number
  pageCount: number
  setPage: (page: number) => void
}) {
  const hasPages = pageCount > 0

  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
      <p className="text-xs text-muted-foreground">
        {hasPages ? `Page ${page + 1} / ${pageCount}` : 'Page 0 / 0'}
      </p>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          className="gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Previous
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={!hasPages || page >= pageCount - 1}
          onClick={() => setPage(page + 1)}
          className="gap-1"
        >
          Next
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
