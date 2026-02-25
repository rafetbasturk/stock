import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DataTableFilter } from '@/components/datatable/types'
import type { DeliveryListRow } from '@/types'
import type { ModalState } from '@/lib/types/types.modal'
import type { DeliveriesSearch } from '@/lib/types/types.search'
import { getColumns } from '@/components/deliveries/columns'
import { DeliveriesDataTable } from '@/components/deliveries/DeliveriesDataTable'
import { DeliveryDeleteDialog } from '@/components/deliveries/DeliveryDeleteDialog'
import { DeliveryForm } from '@/components/deliveries/DeliveryForm'
import { DeliveryListHeader } from '@/components/deliveries/DeliveryListHeader'
import { useDeleteDeliveryMutation } from '@/lib/mutations/deliveries'
import { useAppTimeZone } from '@/hooks/useAppTimeZone'
import {
  deliveriesQuery,
  getFilterOptions,
  lastDeliveryNumberQuery,
  lastReturnDeliveryNumberQuery,
} from '@/lib/queries/deliveries'
import { ordersSelectQuery } from '@/lib/queries/orders'
import {
  deliveriesSearchSchema,
  deliveriesSortFields,
  normalizeDeliveriesSearch,
} from '@/lib/types/types.search'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { ListPendingComponent } from '@/components/ListPendingComponent'

export const Route = createFileRoute('/deliveries/')({
  validateSearch: zodValidator(deliveriesSearchSchema),
  loaderDeps: ({ search }) => normalizeDeliveriesSearch(search),
  loader: async ({ context }) => {
    // const normalizedDeps = normalizeDeliveriesSearch(deps)

    return await Promise.all([
      // context.queryClient.ensureQueryData(deliveriesQuery(normalizedDeps)),
      context.queryClient.prefetchQuery(lastDeliveryNumberQuery),
      context.queryClient.prefetchQuery(lastReturnDeliveryNumberQuery),
      context.queryClient.prefetchQuery(getFilterOptions),
      context.queryClient.prefetchQuery(ordersSelectQuery),
    ])
  },
  component: DeliveryList,
  pendingComponent: ListPendingComponent,
})

function DeliveryList() {
  const { t, i18n } = useTranslation('entities')
  const timeZone = useAppTimeZone()
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()

  const [modalState, setModalState] = useState<ModalState<DeliveryListRow>>({
    type: 'closed',
  })
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), [])
  const openAddModal = useCallback(() => setModalState({ type: 'adding' }), [])
  const openEditModal = useCallback(
    (delivery: DeliveryListRow) =>
      setModalState({ type: 'editing', item: delivery }),
    [],
  )

  const deliveriesQ = useQuery(deliveriesQuery(search))

  const deliveriesData = deliveriesQ.data

  const deliveries = deliveriesData?.data ?? []
  const total = deliveriesData?.total ?? 0
  const pageIndex = deliveriesData?.pageIndex ?? search.pageIndex
  const pageSize = deliveriesData?.pageSize ?? search.pageSize

  const deleteMutation = useDeleteDeliveryMutation()

  const pendingDeleteDelivery = useMemo(
    () =>
      pendingDeleteId === null
        ? null
        : (deliveries.find((d) => d.id === pendingDeleteId) ?? null),
    [deliveries, pendingDeleteId],
  )

  const handleDeleteDelivery = useCallback(
    (id: number) => {
      if (deleteMutation.isPending) return
      setPendingDeleteId(id)
    },
    [deleteMutation.isPending],
  )

  const confirmDeleteDelivery = useCallback(() => {
    if (pendingDeleteId === null || deleteMutation.isPending) return

    deleteMutation.mutate(
      { id: pendingDeleteId },
      {
        onSettled: () => setPendingDeleteId(null),
      },
    )
  }, [deleteMutation, pendingDeleteId])

  const closeDeleteDialog = useCallback(() => {
    if (deleteMutation.isPending) return
    setPendingDeleteId(null)
  }, [deleteMutation.isPending])

  const deleteDeliveryLabel = pendingDeleteDelivery
    ? pendingDeleteDelivery.delivery_number
    : t('deliveries.fallback_label')

  const isDeleteDialogOpen = pendingDeleteId !== null

  useEffect(() => {
    if (pendingDeleteId !== null && !pendingDeleteDelivery) {
      setPendingDeleteId(null)
    }
  }, [pendingDeleteDelivery, pendingDeleteId])

  // filter options
  const { data: filterOptions } = useSuspenseQuery(getFilterOptions)
  const { data: orders } = useSuspenseQuery(ordersSelectQuery)
  const { data: lastDeliveryNumber } = useSuspenseQuery(lastDeliveryNumberQuery)
  const { data: lastReturnDeliveryNumber } = useSuspenseQuery(
    lastReturnDeliveryNumberQuery,
  )

  const customFilters: Array<DataTableFilter> = useMemo(
    () => [
      {
        columnId: 'customerId',
        label: t('deliveries.filters.customer'),
        type: 'multi',
        options: filterOptions.customers.map((c) => ({
          value: String(c.id),
          label: c.name,
        })),
      },
      {
        columnId: 'kind',
        label: t('deliveries.filters.kind'),
        type: 'select',
        options: [
          { value: 'DELIVERY', label: t('deliveries.kinds.delivery') },
          { value: 'RETURN', label: t('deliveries.kinds.return') },
        ],
      },
      {
        columnId: 'dateRange',
        label: t('deliveries.filters.daterange'),
        type: 'daterange',
      },
    ],
    [filterOptions.customers, t],
  )

  const handleSearchChange = useCallback(
    (updates: Partial<DeliveriesSearch>, replaceAll = false) => {
      navigate({
        search: (prev: DeliveriesSearch) => {
          const next: Record<string, any> = replaceAll
            ? { ...updates }
            : { ...prev, ...updates }

          Object.keys(next).forEach((k) => {
            if (next[k] === undefined) {
              delete next[k]
            }
          })

          return next as DeliveriesSearch
        },
        replace: true,
      })
    },
    [navigate],
  )

  const columns = useMemo(
    () =>
      getColumns(
        openEditModal,
        handleDeleteDelivery,
        t,
        i18n.language,
        timeZone,
      ),
    [handleDeleteDelivery, openEditModal, t, i18n.language, timeZone],
  )

  return (
    <ListPageLayout header={<DeliveryListHeader onAdd={openAddModal} />}>
      <DeliveriesDataTable
        deliveries={deliveries}
        columns={columns}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isFetching={deliveriesQ.isFetching}
        customFilters={customFilters}
        search={search}
        onSearchChange={handleSearchChange}
        onPageChange={(p) => handleSearchChange({ pageIndex: p })}
        onPageSizeChange={(s) =>
          handleSearchChange({ pageSize: s, pageIndex: 0 })
        }
        onRowClick={(id) =>
          navigate({
            to: '/deliveries/$id',
            params: { id: String(id) },
          })
        }
        allowedSortBy={deliveriesSortFields}
      />
      {modalState.type !== 'closed' && (
        <DeliveryForm
          item={modalState.type === 'editing' ? modalState.item : undefined}
          orders={orders}
          lastDeliveryNumber={lastDeliveryNumber}
          lastReturnDeliveryNumber={lastReturnDeliveryNumber}
          onClose={closeModal}
        />
      )}

      <DeliveryDeleteDialog
        open={isDeleteDialogOpen}
        isDeleting={deleteMutation.isPending}
        deliveryLabel={deleteDeliveryLabel}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteDelivery}
      />
    </ListPageLayout>
  )
}