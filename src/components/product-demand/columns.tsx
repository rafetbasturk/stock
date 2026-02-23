import { Language } from '@/lib/types/types.settings'
import type { ColumnDef } from '@tanstack/react-table'
import { formatDateTime } from '@/lib/datetime'

export type ProductDemandRow = {
  customer_id: number
  customer_code: string
  customer_name: string
  product_id: number
  product_code: string
  product_name: string
  ordered_times: number
  total_pieces: number
  avg_pieces_per_order: number
  last_order_date: Date | null
}

export const getColumns = (
  t: (key: string) => string,
  lang?: Language,
  timeZone?: string,
): Array<ColumnDef<ProductDemandRow>> => {
  return [
    {
      accessorKey: 'product_code',
      header: t('productDemand.columns.product_code'),
      minSize: 200,
      size: 300,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.product_code}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.product_name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'last_order_date',
      header: () => (
        <div>
          {t('productDemand.columns.last_order_date')}
        </div>
      ),
      size: 150,
      cell: ({ row }) => {
        const value = row.original.last_order_date
        if (!value) return <div className="text-muted-foreground">-</div>
        return (
          <div>
            {formatDateTime(value, {
              locale: lang ?? 'tr',
              timeZone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'ordered_times',
      header: () => (
        <div className="m-auto">{t('productDemand.columns.ordered_times')}</div>
      ),
      size: 120,
      cell: ({ row }) => (
        <div className="text-center tabular-nums">
          {row.original.ordered_times}
        </div>
      ),
    },
    {
      accessorKey: 'total_pieces',
      header: () => (
        <div className="m-auto">{t('productDemand.columns.total_pieces')}</div>
      ),
      size: 120,
      cell: ({ row }) => (
        <div className="text-center tabular-nums">
          {row.original.total_pieces}
        </div>
      ),
    },
    {
      accessorKey: 'avg_pieces_per_order',
      header: () => (
        <div className="m-auto">
          {t('productDemand.columns.avg_pieces_per_order')}
        </div>
      ),
      size: 160,
      cell: ({ row }) => (
        <div className="text-center font-semibold tabular-nums">
          {row.original.avg_pieces_per_order.toLocaleString(lang ?? 'tr', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
  ]
}
