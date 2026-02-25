import { Badge } from '../ui/badge'
import { DataTableRowActions } from '../DataTableRowActions'
import {
  STOCK_MOVEMENT_BADGE_CLASSES,
  
  getStockMovementTypeLabel,
  getStockQuantityClass
} from './movementPresentation'
import type {StockMovementType} from './movementPresentation';
import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { ActionMenuItem, MovementRow } from '@/types'
import type { ModalState } from '@/lib/types/types.modal'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/datetime'

export const getColumns = (
  setModalState: (state: ModalState<MovementRow>) => void,
  t: TFunction,
  onNavigateToSource: (movement: MovementRow) => void,
  locale: string,
  options?: {
    includeActions?: boolean
    includeProduct?: boolean
  },
): Array<ColumnDef<MovementRow>> => {
  const includeActions = options?.includeActions ?? true
  const includeProduct = options?.includeProduct ?? true

  const columns: Array<ColumnDef<MovementRow>> = []

  if (includeActions) {
    columns.push({
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      size: 40,
      cell: ({ row }) => {
        const movement = row.original
        const isEditable =
          !movement.reference_type ||
          movement.reference_type === 'adjustment' ||
          movement.reference_type === 'transfer'

        const actions: Array<ActionMenuItem<MovementRow>> = []

        if (isEditable) {
          actions.push(
            {
              label: t('entities:actions.edit'),
              action: (m) => setModalState({ type: 'editing', item: m }),
              separatorAfter: true,
            },
            {
              label: t('entities:actions.delete'),
              action: (m) => setModalState({ type: 'deleting', item: m }),
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
    })
  }

  columns.push({
    accessorKey: 'created_at',
    header: t('date'),
    meta: { filterTitle: t('date') },
    size: 180,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatDateTime(row.original.created_at, {
          locale,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    ),
  })

  if (includeProduct) {
    columns.push({
      id: 'product',
      header: t('product'),
      meta: { filterTitle: t('product') },
      minSize: 200,
      size: 280,
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original.product
        return (
          <div className="flex flex-col truncate">
            <span className="font-medium text-foreground">{product.code}</span>
            <span className="text-xs text-muted-foreground">
              {product.name}
            </span>
          </div>
        )
      },
    })
  }

  columns.push({
    accessorKey: 'movement_type',
    header: () => <div className="text-right md:m-auto">{t('type')}</div>,
    meta: { filterTitle: t('type') },
    size: 130,
    enableSorting: false,
    cell: ({ row }) => {
      const type = row.original.movement_type as StockMovementType

      return (
        <Badge
          variant="outline"
          className={cn(
            'w-fit md:w-full',
            STOCK_MOVEMENT_BADGE_CLASSES[type],
          )}
        >
          {getStockMovementTypeLabel(t, type)}
        </Badge>
      )
    },
  })

  columns.push({
    accessorKey: 'quantity',
    header: () => <div className="m-auto">{t('quantity')}</div>,
    meta: { filterTitle: t('quantity') },
    size: 100,
    enableSorting: false,
    cell: ({ row }) => {
      const qty = row.original.quantity
      return (
        <div
          className={cn(
            'text-right md:text-center font-mono font-bold',
            getStockQuantityClass(qty),
          )}
        >
          {qty > 0 ? `+${qty}` : qty}
        </div>
      )
    },
  })

  columns.push({
    accessorKey: 'createdBy.username',
    header: t('user'),
    meta: { filterTitle: t('user') },
    size: 120,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-muted-foreground truncate">
        {row.original.createdBy.username || '-'}
      </div>
    ),
  })

  columns.push({
    id: 'reference',
    header: t('reference'),
    meta: { filterTitle: t('reference') },
    size: 160,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-xs text-muted-foreground truncate">
        {row.original.reference_type} #{row.original.reference_id}
      </div>
    ),
  })

  columns.push({
    accessorKey: 'notes',
    header: t('notes'),
    meta: { filterTitle: t('notes') },
    minSize: 220,
    size: 300,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-muted-foreground truncate">
        {row.original.notes || '-'}
      </div>
    ),
  })

  return columns
}
