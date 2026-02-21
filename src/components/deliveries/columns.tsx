import type { ColumnDef } from '@tanstack/react-table'

import type { ActionMenuItem, DeliveryListRow } from '@/types'

import { DataTableRowActions } from '../DataTableRowActions'
import { convertToCurrencyFormat } from '@/lib/currency'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

export function getColumns(
  onEdit: (delivery: DeliveryListRow) => void,
  onDelete: (id: number) => void,
  t: (key: string) => string,
): ColumnDef<DeliveryListRow, unknown>[] {
  const deliveryActions: ActionMenuItem<DeliveryListRow>[] = [
    {
      label: t('actions.edit'),
      action: (delivery) => onEdit(delivery),
      separatorAfter: true,
    },
    {
      label: t('actions.delete'),
      action: (delivery) => onDelete(delivery.id),
      isDestructive: true,
    },
  ]

  return [
    {
      id: 'dateRange',
      header: () => null,
      enableSorting: false,
      enableColumnFilter: false,
      enableHiding: true,
      meta: { isFilterOnly: true },
    },
    {
      id: 'expand-toggle',
      size: 28,
      enableSorting: false,
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
      enableSorting: false,
      enableHiding: false,
      size: 28,
      cell: ({ row }) => (
        <DataTableRowActions row={row} actions={deliveryActions} />
      ),
    },
    {
      accessorKey: 'delivery_number',
      header: t('deliveries.columns.delivery_number'),
      size: 200,
      cell: ({ row }) => (
        <div className="truncate">{row.getValue('delivery_number')}</div>
      ),
    },
    {
      accessorKey: 'delivery_date',
      header: t('deliveries.columns.delivery_date'),
      size: 200,
      cell: ({ row }) => {
        const formatted = new Date(
          row.getValue('delivery_date'),
        ).toLocaleDateString('tr-TR')
        return <div>{formatted}</div>
      },
    },
    {
      header: t('deliveries.columns.customer'),
      accessorKey: 'customerId',
      size: 200,
      cell: ({ row }) => <div>{row.original.customer.name}</div>,
    },
    {
      accessorKey: 'kind',
      header: t('deliveries.columns.kind'),
      size: 130,
      cell: ({ row }) => {
        const isReturn = row.original.kind === 'RETURN'
        return (
          <Badge
            variant="outline"
            className={
              isReturn
                ? 'border-red-300 text-red-700 bg-red-50'
                : 'border-green-300 text-green-700 bg-green-50'
            }
          >
            {isReturn ? t('deliveries.kinds.return') : t('deliveries.kinds.delivery')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'total_amount',
      meta: {
        filterTitle: t('deliveries.columns.total_amount'),
      },
      header: () => (
        <div className="ml-auto">{t('deliveries.columns.total_amount')}</div>
      ),
      size: 150,
      cell: ({ row }) => {
        const isReturn = row.original.kind === 'RETURN'
        const total = Number(row.getValue('total_amount') ?? 0)
        const amount = convertToCurrencyFormat({
          cents: Math.round(total * 100),
          currency: row.original.currency,
        })

        return (
          <div
            className={`text-right font-medium ${isReturn ? 'text-red-500' : ''}`}
          >
            {amount}
          </div>
        )
      },
    },
  ]
}
