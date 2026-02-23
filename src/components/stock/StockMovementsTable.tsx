import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useDeleteStockMovement } from '@/lib/mutations/stock'
import { stockQuery } from '@/lib/queries/stock'
import type { HistoryModalState } from '@/lib/types/types.modal'
import type { SearchUpdates, StockSearch } from '@/lib/types/types.search'
import type { MovementRow } from '@/types'

import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { EditStockMovementDialog } from '@/components/stock/EditStockMovementDialog'
import { StockDataTable } from '@/components/stock/StockDataTable'
import { getColumns } from '@/components/stock/columns'
import { getStockMovementFilterOptions } from '@/components/stock/movementPresentation'
import { DataTableFilter } from '../datatable/types'

interface Props {
  productId: number
  enableActions?: boolean
}

function coerceStockSearchValue(
  key: string,
  value: string | number | undefined,
): string | number | undefined {
  if (value === undefined) return undefined
  if (key === 'pageIndex' || key === 'pageSize') {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : undefined
  }
  return value
}

export function StockMovementsTable({
  productId,
  enableActions = false,
}: Props) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['stock', 'entities'])
  const deleteMutation = useDeleteStockMovement()

  const [search, setSearch] = useState<StockSearch>({
    pageIndex: 0,
    pageSize: 20,
    productId,
  })
  const [modalState, setModalState] = useState<HistoryModalState>({
    type: 'closed',
    movement: null,
  })

  const { data: result, isFetching } = useQuery(stockQuery(search))

  const closeModal = useCallback(
    () => setModalState({ type: 'closed', movement: null }),
    [],
  )

  const navigateToProduct = useCallback(
    (id: number) =>
      navigate({
        to: '/products/$id',
        params: { id: String(id) },
      }),
    [navigate],
  )

  const handleNavigateToSource = useCallback(
    (movement: MovementRow) => {
      const sourceId = movement.reference_id
      if (!sourceId) return

      if (movement.reference_type === 'transfer') {
        navigateToProduct(sourceId)
        return
      }

      if (movement.reference_type === 'order') {
        navigate({
          to: '/orders/$id',
          params: { id: String(sourceId) },
        })
        return
      }

      navigate({
        to: '/deliveries/$id',
        params: { id: String(sourceId) },
      })
    },
    [navigate, navigateToProduct],
  )

  const customFilters: Array<DataTableFilter> = useMemo(
    () => [
      {
        columnId: 'movementType',
        label: t('movement_type_filter'),
        type: 'multi',
        options: getStockMovementFilterOptions(t),
      },
    ],
    [t],
  )

  const columns = useMemo(
    () =>
      getColumns(setModalState, t, handleNavigateToSource, i18n.language, {
        includeActions: enableActions,
        includeProduct: false,
      }),
    [t, handleNavigateToSource, i18n.language, enableActions],
  )

  const handleSearchChange = useCallback(
    (updates: SearchUpdates) => {
      setSearch((prev) => {
        const next: SearchUpdates = {
          ...prev,
          productId,
          ...Object.fromEntries(
            Object.entries(updates).map(([key, value]) => [
              key,
              coerceStockSearchValue(key, value),
            ]),
          ),
        }

        Object.keys(next).forEach((key) => {
          if (next[key] === undefined) {
            delete next[key]
          }
        })

        return next as StockSearch
      })
    },
    [productId],
  )

  return (
    <>
      <StockDataTable
        stocks={result?.data ?? []}
        columns={columns}
        total={result?.total ?? 0}
        search={search}
        customFilters={customFilters}
        pageIndex={search.pageIndex}
        pageSize={search.pageSize}
        onSearchChange={handleSearchChange}
        onPageChange={(pageIndex) =>
          setSearch((prev) => ({ ...prev, pageIndex }))
        }
        onPageSizeChange={(pageSize) =>
          setSearch((prev) => ({ ...prev, pageSize, pageIndex: 0 }))
        }
        onRowClick={() => {}}
        isFetching={isFetching}
      />

      {enableActions && (
        <>
          <EditStockMovementDialog
            open={modalState.type === 'editing'}
            movement={modalState.movement}
            onOpenChange={(open) => {
              if (!open) closeModal()
            }}
          />

          <ConfirmDeleteDialog
            open={modalState.type === 'deleting'}
            isDeleting={deleteMutation.isPending}
            title={t('delete_title')}
            description={t('delete_desc')}
            itemLabel={`#${modalState.movement?.id}`}
            cancelLabel={t('cancel')}
            confirmLabel={t('entities:actions.delete')}
            confirmingLabel={t('processing')}
            onClose={closeModal}
            onConfirm={() => {
              if (modalState.movement) {
                deleteMutation.mutate(
                  { id: modalState.movement.id },
                  {
                    onSuccess: closeModal,
                  },
                )
              }
            }}
          />
        </>
      )}
    </>
  )
}
