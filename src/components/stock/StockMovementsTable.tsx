import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useDeleteStockMovement } from '@/lib/mutations/stock'
import { stockQuery } from '@/lib/queries/stock'
import type { SearchUpdates, StockSearch } from '@/lib/types/types.search'
import type { MovementRow } from '@/types'
import { useIsMobile } from '@/hooks/use-mobile'

import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import DataTable from '@/components/datatable'
import { StockMovementDialog } from '@/components/stock/StockMovementDialog'
import { getColumns } from '@/components/stock/columns'
import { getStockMovementFilterOptions } from '@/components/stock/movementPresentation'
import { DataTableFilter } from '../datatable/types'
import { ModalState } from '@/lib/types/types.modal'

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
  const isMobile = useIsMobile()
  const { t, i18n } = useTranslation(['stock', 'entities'])
  const deleteMutation = useDeleteStockMovement()

  const [search, setSearch] = useState<StockSearch>({
    pageIndex: 0,
    pageSize: 100,
    productId,
  })

  const [modalState, setModalState] = useState<ModalState<MovementRow>>({
    type: 'closed',
  })

  const modalItem =
    modalState.type === 'editing' || modalState.type === 'deleting'
      ? modalState.item
      : null

  const { data: result, isFetching } = useQuery(stockQuery(search))

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), [])

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
      getColumns(
        setModalState,
        t,
        handleNavigateToSource,
        i18n.language,
        {
          includeActions: enableActions,
          includeProduct: false,
        },
      ),
    [t, handleNavigateToSource, i18n.language, enableActions],
  )

  const initialColumnVisibility = useMemo(
    () =>
      isMobile
        ? {
            createdBy_username: false,
            reference: false,
            notes: false,
          }
        : undefined,
    [isMobile],
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
      <div className="mt-6 border rounded-lg shadow-sm">
        <DataTable
          data={result?.data ?? []}
          columns={columns}
          total={result?.total ?? 0}
          serverPageIndex={search.pageIndex}
          serverPageSize={search.pageSize}
          onServerPageChange={(pageIndex) =>
            setSearch((prev) => ({ ...prev, pageIndex }))
          }
          onServerPageSizeChange={(pageSize) =>
            setSearch((prev) => ({ ...prev, pageSize, pageIndex: 0 }))
          }
          search={search}
          onSearchChange={handleSearchChange}
          customFilters={customFilters}
          isFetching={isFetching}
          initialColumnVisibility={initialColumnVisibility}
          showColumnVisibilityToggle={!isMobile}
        />
      </div>

      {enableActions && (
        <>
          <StockMovementDialog
            mode="edit"
            open={modalState.type === 'editing'}
            movement={modalState.type === 'editing' ? modalState.item : null}
            onOpenChange={(open) => {
              if (!open) closeModal()
            }}
          />

          <ConfirmDeleteDialog
            open={modalState.type === 'deleting'}
            isDeleting={deleteMutation.isPending}
            title={t('delete_title')}
            description={t('delete_desc')}
            itemLabel={`#${modalItem?.id}`}
            cancelLabel={t('cancel')}
            confirmLabel={t('entities:actions.delete')}
            confirmingLabel={t('processing')}
            onClose={closeModal}
            onConfirm={() => {
              if (modalItem) {
                deleteMutation.mutate(
                  { id: modalItem.id },
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
