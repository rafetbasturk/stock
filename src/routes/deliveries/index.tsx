import { DataTableFilter } from '@/components/DataTable'
import { getColumns } from '@/components/deliveries/columns'
import { DeliveriesDataTable } from '@/components/deliveries/DeliveriesDataTable'
import { DeliveryDeleteDialog } from '@/components/deliveries/DeliveryDeleteDialog'
import { DeliveryForm } from '@/components/deliveries/DeliveryForm'
import { DeliveryListHeader } from '@/components/deliveries/DeliveryListHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { debounce } from '@/lib/debounce'
import { useDeleteDeliveryMutation } from '@/lib/mutations/deliveries'
import {
  deliveriesQuery,
  getFilterOptions,
  lastDeliveryNumberQuery,
} from '@/lib/queries/deliveries'
import { ordersSelectQuery } from '@/lib/queries/orders'
import { DeliveriesSearch, deliveriesSearchSchema } from '@/lib/types'
import { DeliveryListRow } from '@/types'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/deliveries/')({
  validateSearch: zodValidator(deliveriesSearchSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const data = await Promise.all([
      context.queryClient.prefetchQuery(lastDeliveryNumberQuery()),
      context.queryClient.prefetchQuery(getFilterOptions()),
      context.queryClient.prefetchQuery(ordersSelectQuery),
      context.queryClient.ensureQueryData(deliveriesQuery(deps)),
    ])
    return data
  },
  component: RouteComponent,
  pendingComponent: DeliveriesPending,
})

function RouteComponent() {
  const { t } = useTranslation('entities')
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()

  const [modalState, setModalState] = useState<
    | { type: 'closed' }
    | { type: 'adding' }
    | { type: 'editing'; delivery: DeliveryListRow }
  >({ type: 'closed' })
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), [])
  const openAddModal = useCallback(() => setModalState({ type: 'adding' }), [])
  const openEditModal = useCallback(
    (delivery: DeliveryListRow) => setModalState({ type: 'editing', delivery }),
    [],
  )

  const deliveriesQ = useSuspenseQuery(deliveriesQuery(search))
  const { data: deliveries, total, pageIndex, pageSize } = deliveriesQ.data

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
  const { data: filterOptions } = useSuspenseQuery(getFilterOptions())
  const { data: orders } = useSuspenseQuery(ordersSelectQuery)
  const { data: lastDeliveryNumber } = useSuspenseQuery(
    lastDeliveryNumberQuery(),
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
        columnId: 'dateRange',
        label: t('deliveries.filters.daterange'),
        type: 'daterange',
      },
    ],
    [filterOptions.customers, t],
  )

  const handleSearchChange = useCallback(
    (updates: Record<string, string | undefined>) => {
      navigate({
        search: (prev: DeliveriesSearch) => {
          const merged = { ...prev, ...updates } as Record<string, any>
          Object.keys(merged).forEach(
            (k) => merged[k] === undefined && delete merged[k],
          )
          return merged as DeliveriesSearch
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

  const columns = useMemo(
    () => getColumns(openEditModal, handleDeleteDelivery, t),
    [handleDeleteDelivery, openEditModal, t],
  )

  return (
    <>
      <DeliveryListHeader onAdd={openAddModal} />

      <DeliveriesDataTable
        deliveries={deliveries}
        columns={columns}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isFetching={deliveriesQ.isFetching}
        customFilters={customFilters}
        search={search}
        onSearchChange={debouncedSearchChange}
        onPageChange={(p) => handleSearchChange({ pageIndex: String(p) })}
        onPageSizeChange={(s) =>
          handleSearchChange({ pageSize: String(s), pageIndex: '0' })
        }
        onRowClick={(id) =>
          navigate({
            to: '/deliveries/$id',
            params: { id: String(id) },
          })
        }
      />
      {modalState.type !== 'closed' && (
        <DeliveryForm
          item={modalState.type === 'editing' ? modalState.delivery : undefined}
          orders={orders}
          lastDeliveryNumber={lastDeliveryNumber}
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
    </>
  )
}

function DeliveriesPending() {
  const { t } = useTranslation('entities')
  return <LoadingSpinner variant="full-page" text={t('deliveries.loading')} />
}
