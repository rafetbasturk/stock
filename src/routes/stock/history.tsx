import { useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { HistoryIcon, Search, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { ActionMenuItem } from '@/types'
import type {DataTableFilter} from '@/components/DataTable';
import DataTable from '@/components/DataTable'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { DataTableRowActions } from '@/components/DataTableRowActions'
import PageHeader from '@/components/PageHeader'
import { EditStockMovementDialog } from '@/components/stock/EditStockMovementDialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDeleteStockMovement } from '@/lib/mutations/stock'
import { stockQuery } from '@/lib/queries/stock'
import { stockSearchSchema } from '@/lib/types/types.search'

export const Route = createFileRoute('/stock/history')({
  component: RouteComponent,
  validateSearch: zodValidator(stockSearchSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    return await context.queryClient.ensureQueryData(stockQuery(deps))
  },
  staticData: {
    sidebar: {
      label: 'nav.stock_history',
      icon: HistoryIcon,
      order: 60,
    },
  },
})

type MovementRow = {
  id: number
  product_id: number
  created_at: Date
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVE' | 'RELEASE'
  quantity: number
  reference_type: string | null
  reference_id: number | null
  notes: string | null
  createdBy: {
    id: number
    username: string
  }
  product: {
    code: string
    name: string
  }
}

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { t } = useTranslation(['stock', 'entities'])
  const deleteMutation = useDeleteStockMovement()

  const [modalState, setModalState] = useState<{
    type: 'closed' | 'editing' | 'deleting'
    movement: MovementRow | null
  }>({ type: 'closed', movement: null })

  const { data: result, isFetching } = useSuspenseQuery(stockQuery(search))

  const customFilters: Array<DataTableFilter> = useMemo(
    () => [
      {
        columnId: 'movementType',
        label: t('movement_type_filter'),
        type: 'multi',
        options: [
          { value: 'IN', label: t('stock_in') },
          { value: 'OUT', label: t('stock_out') },
          { value: 'ADJUSTMENT', label: t('adjust_stock') },
          { value: 'RESERVE', label: t('movement_types.reserve') },
          { value: 'RELEASE', label: t('movement_types.release') },
        ],
      },
    ],
    [t],
  )

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

  const columns: Array<ColumnDef<MovementRow>> = [
    {
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      size: 56,
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
            action: (m) => {
              const route =
                m.reference_type === 'order' ? '/orders' : '/deliveries'
              ;(navigate as any)({
                to: `${route}/$id`,
                params: { id: String(m.reference_id) },
              })
            },
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
            <span className="text-xs text-muted-foreground">{product.name}</span>
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
        <div className="text-muted-foreground truncate">{row.original.notes || '-'}</div>
      ),
    },
  ]

  const inCount = result.data.filter((row) => row.quantity > 0).length
  const outCount = result.data.filter((row) => row.quantity < 0).length

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={t('stock_history')}
        description={t('stock_history_desc')}
        showBack
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('summary.total_movements')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{result.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('summary.stock_in_rows')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">{inCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('summary.stock_out_rows')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">{outCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="size-4 text-primary" />
            {t('stock_history')}
            <span className="mx-1 text-muted-foreground">•</span>
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <span className="text-sm font-normal text-muted-foreground">
              {t('search_hint')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={result.data}
            total={result.total}
            search={search as Record<string, string | undefined>}
            customFilters={customFilters}
            serverPageIndex={search.pageIndex}
            serverPageSize={search.pageSize}
            enableAutofocus
            showColumnVisibilityToggle
            onSearchChange={(updates) => {
              navigate({
                search: (prev) => {
                  const merged = {
                    ...prev,
                    ...updates,
                  } as Record<string, unknown>

                  Object.keys(merged).forEach((key) => {
                    if (merged[key] === undefined) {
                      delete merged[key]
                    }
                  })

                  return merged as typeof search
                },
                replace: true,
              })
            }}
            onServerPageChange={(index) =>
              navigate({
                search: (prev) => ({ ...prev, pageIndex: index }),
                replace: true,
              })
            }
            onServerPageSizeChange={(size) =>
              navigate({
                search: (prev) => ({ ...prev, pageSize: size, pageIndex: 0 }),
                replace: true,
              })
            }
            onRowClick={(row) => {
              if (row.product_id) {
                ;(navigate as any)({
                  to: '/products/$id',
                  params: { id: String(row.product_id) },
                })
              }
            }}
          />
        </CardContent>
      </Card>

      <EditStockMovementDialog
        open={modalState.type === 'editing'}
        movement={modalState.movement}
        onOpenChange={(open) =>
          setModalState(open ? modalState : { type: 'closed', movement: null })
        }
      />

      <ConfirmDeleteDialog
        open={modalState.type === 'deleting'}
        isDeleting={deleteMutation.isPending}
        title={t('delete_title')}
        description={t('delete_desc')}
        itemLabel={`#${modalState.movement?.id}`}
        cancelLabel={t('cancel')}
        confirmLabel={t('entities:actions.delete')}
        confirmingLabel={isFetching ? t('processing') : t('processing')}
        onClose={() => setModalState({ type: 'closed', movement: null })}
        onConfirm={() => {
          if (modalState.movement) {
            deleteMutation.mutate(modalState.movement.id, {
              onSuccess: () =>
                setModalState({ type: 'closed', movement: null }),
            })
          }
        }}
      />
    </div>
  )
}
