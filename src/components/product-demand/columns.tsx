import type { ColumnDef } from '@tanstack/react-table'
import type { Language } from '@/lib/types/types.settings'
import type { ProductDemandRow } from '@/types'
import { formatDateTime } from '@/lib/datetime'

export const getColumns = (
  t: (key: string) => string,
  lang?: Language,
  timeZone?: string,
): Array<ColumnDef<ProductDemandRow>> => {
  return [
    {
      accessorKey: 'customer_code',
      header: t('productDemand.columns.customer_code'),
      meta: {
        filterTitle: t('productDemand.columns.customer_code'),
        sortKey: 'customer_code',
      },
      minSize: 200,
      size: 260,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customer_code}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.customer_name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'product_code',
      header: t('productDemand.columns.product_code'),
      meta: {
        filterTitle: t('productDemand.columns.product_code'),
        sortKey: 'product_code',
      },
      minSize: 200,
      size: 300,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.product_code}</div>
      ),
    },
    {
      accessorKey: 'last_order_date',
      header: t('productDemand.columns.last_order_date'),
      meta: {
        filterTitle: t('productDemand.columns.last_order_date'),
        sortKey: 'last_order_date',
      },
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
      header: t('productDemand.columns.ordered_times'),
      meta: {
        filterTitle: t('productDemand.columns.ordered_times'),
        sortKey: 'ordered_times',
        headerAlign: 'center',
      },
      size: 120,
      cell: ({ row }) => (
        <div className="text-right md:text-center tabular-nums">
          {row.original.ordered_times}
        </div>
      ),
    },
    {
      accessorKey: 'total_pieces',
      header: t('productDemand.columns.total_pieces'),
      meta: {
        filterTitle: t('productDemand.columns.total_pieces'),
        sortKey: 'total_pieces',
        headerAlign: 'center',
      },
      size: 120,
      cell: ({ row }) => (
        <div className="text-right md:text-center tabular-nums">
          {row.original.total_pieces}
        </div>
      ),
    },
    {
      accessorKey: 'avg_pieces_per_order',
      header: t('productDemand.columns.avg_pieces_per_order'),
      meta: {
        filterTitle: t('productDemand.columns.avg_pieces_per_order'),
        sortKey: 'avg_pieces_per_order',
        headerAlign: 'center',
      },
      size: 160,
      cell: ({ row }) => (
        <div className="text-right md:text-center font-semibold tabular-nums">
          {row.original.avg_pieces_per_order.toLocaleString(lang ?? 'tr', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
  ]
}
