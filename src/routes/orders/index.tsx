import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useTranslation } from 'react-i18next'

import type { OrdersSearch } from '@/lib/types'
import type { OrderListRow } from '@/types'
import { ordersSearchSchema } from '@/lib/types'
import { debounce } from '@/lib/debounce'
import { useDeleteOrderMutation } from '@/lib/mutations/orders'
import {
  getFilterOptions,
  lastOrderNumberQuery,
  ordersQuery,
} from '@/lib/queries/orders'

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getColumns } from '@/components/orders/columns'
import OrderForm from '@/components/orders/OrderForm'
import { OrderListHeader } from '@/components/orders/OrderListHeader'
import { OrdersDataTable } from '@/components/orders/OrdersDataTable'
import { OrderDeleteDialog } from '@/components/orders/OrderDeleteDialog'
import { DataTableFilter } from '@/components/DataTable'

type ModalState =
  | { type: 'closed' }
  | { type: 'adding' }
  | { type: 'editing'; order: OrderListRow }

export const Route = createFileRoute('/orders/')({
  validateSearch: zodValidator(ordersSearchSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    return await Promise.all([
      context.queryClient.prefetchQuery(lastOrderNumberQuery()),
      context.queryClient.prefetchQuery(getFilterOptions()),
      context.queryClient.ensureQueryData(ordersQuery(deps)),
    ])
  },
  component: OrderList,
  pendingComponent: OrdersPending,
})

function OrderList() {
  const { t } = useTranslation('entities')
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()

  const [modalState, setModalState] = useState<ModalState>({ type: 'closed' })
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), [])
  const openAddModal = useCallback(() => setModalState({ type: 'adding' }), [])
  const openEditModal = useCallback(
    (order: OrderListRow) => setModalState({ type: 'editing', order }),
    [],
  )

  const deleteMutation = useDeleteOrderMutation()

  const ordersQ = useSuspenseQuery(ordersQuery(search))
  const { data: orders, total, pageIndex, pageSize } = ordersQ.data

  const pendingDeleteOrder = useMemo(
    () =>
      pendingDeleteId === null
        ? null
        : (orders.find((order) => order.id === pendingDeleteId) ?? null),
    [orders, pendingDeleteId],
  )

  const handleDeleteOrder = useCallback(
    (id: number) => {
      if (deleteMutation.isPending) return
      setPendingDeleteId(id)
    },
    [deleteMutation.isPending],
  )

  const confirmDeleteOrder = useCallback(() => {
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

  const deleteOrderLabel = pendingDeleteOrder
    ? pendingDeleteOrder.order_number
    : t('orders.fallback_label')

  const isDeleteDialogOpen = pendingDeleteId !== null

  useEffect(() => {
    if (pendingDeleteId !== null && !pendingDeleteOrder) {
      setPendingDeleteId(null)
    }
  }, [pendingDeleteOrder, pendingDeleteId])

  // filter options
  const { data: filterOptions } = useSuspenseQuery(getFilterOptions())

  const customFilters: Array<DataTableFilter> = useMemo(
    () => [
      {
        columnId: 'customerId',
        label: t('orders.filters.customer'),
        type: 'multi',
        options: filterOptions.customers.map((c) => ({
          value: String(c.id),
          label: c.name,
        })),
      },
      {
        columnId: 'status',
        label: t('orders.filters.status'),
        type: 'multi',
        options: filterOptions.statuses.map((s) => ({
          value: s,
          label: s,
        })),
      },
      {
        columnId: 'dateRange',
        label: t('orders.filters.daterange'),
        type: 'daterange',
      },
    ],
    [filterOptions.customers, filterOptions.statuses, t],
  )

  const handleSearchChange = useCallback(
    (updates: Record<string, string | undefined>) => {
      navigate({
        search: (prev: OrdersSearch) => {
          const merged = { ...prev, ...updates } as Record<string, any>
          Object.keys(merged).forEach(
            (k) => merged[k] === undefined && delete merged[k],
          )
          return merged as OrdersSearch
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
    () => getColumns(openEditModal, handleDeleteOrder, t),
    [handleDeleteOrder, openEditModal, t],
  )

  return (
    <>
      <OrderListHeader onAdd={openAddModal} />
      <OrdersDataTable
        orders={orders}
        columns={columns}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isFetching={ordersQ.isFetching}
        customFilters={customFilters}
        search={search}
        onSearchChange={debouncedSearchChange}
        onPageChange={(p) => handleSearchChange({ pageIndex: String(p) })}
        onPageSizeChange={(s) =>
          handleSearchChange({ pageSize: String(s), pageIndex: '0' })
        }
        onRowClick={(id) =>
          navigate({
            to: '/orders/$id',
            params: { id: String(id) },
          })
        }
      />

      {modalState.type !== 'closed' && (
        <OrderForm
          item={modalState.type === 'editing' ? modalState.order : undefined}
          isSubmitting={false}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}

      <OrderDeleteDialog
        open={isDeleteDialogOpen}
        isDeleting={deleteMutation.isPending}
        orderLabel={deleteOrderLabel}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteOrder}
      />
    </>
  )
}

function OrdersPending() {
  const { t } = useTranslation('entities')
  return <LoadingSpinner variant="full-page" text={t('orders.loading')} />
}
