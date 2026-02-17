import { ActionMenuItem, MovementRow } from '@/types'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '../ui/badge'
import { DataTableRowActions } from '../DataTableRowActions'
import { HistoryModalState } from '@/lib/types/types.modal'
import type { TFunction } from 'i18next'

const movementTypeColors = {
  IN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OUT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ADJUSTMENT:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  RESERVE:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  RELEASE:
    'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
}

export const getColumns = (
  setModalState: (state: HistoryModalState) => void,
  t: TFunction,
  onNavigateToSource: (movement: MovementRow) => void,
): Array<ColumnDef<MovementRow>> => {
  return [
    {
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      size: 40,
      cell: ({ row }) => {
        const movement = row.original
        const isManual =
          !movement.reference_type || movement.reference_type === 'adjustment'

        const actions: Array<ActionMenuItem<MovementRow>> = []

        if (isManual) {
          actions.push(
            {
              label: t('entities:actions.edit'),
              action: (m) => setModalState({ type: 'editing', movement: m }),
              separatorAfter: true,
            },
            {
              label: t('entities:actions.delete'),
              action: (m) => setModalState({ type: 'deleting', movement: m }),
              isDestructive: true,
            },
          )
        } else {
          actions.push({
            label: t('view_source'),
            action: onNavigateToSource,
          })
        }

        return actions.length > 0 ? (
          <DataTableRowActions row={row} actions={actions} />
        ) : null
      },
    },
    {
      accessorKey: 'created_at',
      header: t('date'),
      size: 180,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {new Date(row.original.created_at).toLocaleString()}
        </div>
      ),
    },
    {
      id: 'product',
      header: t('product'),
      minSize: 200,
      size: 280,
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original.product
        return (
          <div className="flex flex-col truncate">
            <span className="font-mono font-medium text-foreground">
              {product.code}
            </span>
            <span className="text-xs text-muted-foreground">
              {product.name}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'movement_type',
      header: () => <div className="m-auto">{t('type')}</div>,
      size: 130,
      enableSorting: false,
      cell: ({ row }) => {
        const type = row.original.movement_type
        const labelMap = {
          IN: t('stock_in'),
          OUT: t('stock_out'),
          ADJUSTMENT: t('adjust_stock'),
          RESERVE: t('movement_types.reserve'),
          RELEASE: t('movement_types.release'),
        }

        return (
          <div className="flex justify-center">
            <Badge variant="outline" className={movementTypeColors[type]}>
              {labelMap[type]}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'quantity',
      header: () => <div className="m-auto">{t('quantity')}</div>,
      size: 100,
      enableSorting: false,
      cell: ({ row }) => {
        const qty = row.original.quantity
        return (
          <div
            className={`text-center font-mono font-bold ${
              qty > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {qty > 0 ? `+${qty}` : qty}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdBy.username',
      header: t('user'),
      size: 120,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.original.createdBy.username || '-'}
        </div>
      ),
    },
    {
      id: 'reference',
      header: t('reference'),
      size: 160,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground truncate">
          {row.original.reference_type} #{row.original.reference_id}
        </div>
      ),
    },
    {
      accessorKey: 'notes',
      header: t('notes'),
      minSize: 220,
      size: 300,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.original.notes || '-'}
        </div>
      ),
    },
  ]
}
