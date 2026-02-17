import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { HistoryIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { DataTableFilter } from '@/components/DataTable'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import PageHeader from '@/components/PageHeader'
import { EditStockMovementDialog } from '@/components/stock/EditStockMovementDialog'
import { useDeleteStockMovement } from '@/lib/mutations/stock'
import { stockQuery } from '@/lib/queries/stock'
import { stockSearchSchema } from '@/lib/types/types.search'
import { getColumns } from '@/components/stock/columns'
import { StockDataTable } from '@/components/stock/StockDataTable'
import { HistoryModalState } from '@/lib/types/types.modal'
import type { MovementRow } from '@/types'
import { debounce } from '@/lib/debounce'

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

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { t } = useTranslation(['stock', 'entities'])
  const deleteMutation = useDeleteStockMovement()

  const [modalState, setModalState] = useState<HistoryModalState>({
    type: 'closed',
    movement: null,
  })

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

  const handleNavigateToSource = useCallback(
    (movement: MovementRow) => {
      const route =
        movement.reference_type === 'order' ? '/orders' : '/deliveries'
      ;(navigate as any)({
        to: `${route}/$id`,
        params: { id: String(movement.reference_id) },
      })
    },
    [navigate],
  )

  const columns = useMemo(
    () => getColumns(setModalState, t, handleNavigateToSource),
    [t, handleNavigateToSource],
  )

  const handleSearchChange = useCallback(
    (updates: Record<string, string | number | undefined>) => {
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
    },
    [navigate],
  )

  const debouncedSearchChange = useMemo(
    () => debounce(handleSearchChange, 400),
    [handleSearchChange],
  )

  useEffect(() => {
    return () => {
      debouncedSearchChange.cancel()
    }
  }, [debouncedSearchChange])

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={t('stock_history')}
        description={t('stock_history_desc')}
        showBack
      />

      <StockDataTable
        stocks={result.data}
        columns={columns}
        total={result.total}
        search={search}
        customFilters={customFilters}
        pageIndex={search.pageIndex}
        pageSize={search.pageSize}
        onSearchChange={debouncedSearchChange}
        onPageChange={(index) =>
          navigate({
            search: (prev) => ({ ...prev, pageIndex: index }),
            replace: true,
          })
        }
        onPageSizeChange={(size) =>
          navigate({
            search: (prev) => ({ ...prev, pageSize: size, pageIndex: 0 }),
            replace: true,
          })
        }
        onRowClick={(row) => {
          if (row.product_id && !row.product?.deleted_at) {
            ;(navigate as any)({
              to: '/products/$id',
              params: { id: String(row.product_id) },
            })
            return
          }

          toast.warning(t('product_unavailable'))
        }}
        getRowClassName={(row) =>
          row.product?.deleted_at
            ? 'opacity-60 cursor-not-allowed hover:cursor-not-allowed'
            : ''
        }
        isFetching={isFetching}
      />

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
            deleteMutation.mutate(
              { id: modalState.movement.id },
              {
                onSuccess: () =>
                  setModalState({ type: 'closed', movement: null }),
              },
            )
          }
        }}
      />
    </div>
  )
}
