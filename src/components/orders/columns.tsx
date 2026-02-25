import { Button } from '../ui/button'
import StatusBadge from '../StatusBadge'
import type { ColumnDef } from '@tanstack/react-table'
import type { ActionMenuItem, OrderListRow } from '@/types'
import { DataTableRowActions } from '@/components/DataTableRowActions'
import { formatDateTime } from '@/lib/datetime'

export const getColumns = (
  onEdit: (order: OrderListRow) => void,
  onDelete: (id: number) => void,
  t: (key: string) => string,
  locale: string,
  timeZone: string,
): Array<ColumnDef<OrderListRow>> => {
  const orderActions: Array<ActionMenuItem<OrderListRow>> = [
    {
      label: t('actions.edit'),
      action: (order) => onEdit(order),
      separatorAfter: true,
    },
    {
      label: t('actions.delete'),
      action: (order) => onDelete(order.id),
      isDestructive: true,
    },
  ]

  return [
    {
      id: 'expand-toggle',
      size: 28,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button
          role="button"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            row.toggleExpanded()
          }}
          size="icon-sm"
        >
          {row.getIsExpanded() ? '▼' : '▶'}
        </Button>
      ),
    },
    {
      id: 'actions',
      size: 28,
      cell: ({ row }) => (
        <DataTableRowActions row={row} actions={orderActions} />
      ),
    },
    {
      accessorKey: 'order_number',
      header: t('orders.columns.order_number'),
      cell: ({ row }) => (
        <div className="truncate">{row.getValue('order_number')}</div>
      ),
    },
    {
      accessorKey: 'order_date',
      header: t('orders.columns.order_date'),
      cell: ({ row }) => (
        <div className="font-medium truncate">
          {formatDateTime(row.getValue('order_date'), {
            locale,
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })}
        </div>
      ),
    },
    {
      id: 'customer_name',
      accessorFn: (row) => row.customer.name,
      header: t('orders.columns.customer'),
      meta: {
        sortKey: 'customer',
      },
      cell: ({ row }) => (
        <div className="font-medium truncate">{row.original.customer.name}</div>
      ),
    },
    {
      accessorKey: 'delivery_address',
      header: t('orders.columns.delivery_address'),
      cell: ({ row }) => (
        <div className="font-medium truncate">
          {row.getValue('delivery_address')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('orders.columns.status'),
      size: 110,
      cell: ({ row }) => {
        const status = row.original.status

        return <StatusBadge status={status} className="px-4 md:px-0 md:w-full" />
      },
      meta: {
        headerAlign: 'center',
      },
    },
    {
      accessorKey: 'total_amount',
      meta: {
        filterTitle: t('orders.columns.total_amount'),
      },
      header: () => (
        <div className="ml-auto">{t('orders.columns.total_amount')}</div>
      ),
      cell: ({ row }) => {
        const totalAmount = Number(row.getValue('total_amount'))
        const formatted = new Intl.NumberFormat('tr', {
          style: 'currency',
          currency: row.original.currency || 'TRY',
        }).format(totalAmount)

        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    // {
    //   id: 'customerId',
    //   accessorKey: 'customerId',
    //   meta: { isFilterOnly: true },
    //   enableHiding: false,
    //   enableSorting: false,
    //   enableResizing: false,
    // },
    // {
    //   id: 'dateRange',
    //   accessorKey: 'dateRange',
    //   meta: { isFilterOnly: true },
    //   enableHiding: false,
    //   enableSorting: false,
    //   enableResizing: false,
    // },
  ]
}
