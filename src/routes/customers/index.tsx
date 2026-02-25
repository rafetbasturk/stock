import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/types'
import type {
  CustomersSearch} from '@/lib/types/types.search';
import type { ModalState } from '@/lib/types/types.modal'
import { CustomerDeleteDialog } from '@/components/customers/CustomerDeleteDialog'
import CustomerForm from '@/components/customers/CustomerForm'
import { getColumns } from '@/components/customers/columns'
import { CustomerListHeader } from '@/components/customers/CustomerListHeader'
import { CustomersDataTable } from '@/components/customers/CustomersDataTable'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useDeleteCustomerMutation } from '@/lib/mutations/customers'
import { customersPaginatedQuery } from '@/lib/queries/customers'
import {
  customerSortFields,
  customersSearchSchema,
  normalizeCustomersSearch,
} from '@/lib/types/types.search'

export const Route = createFileRoute('/customers/')({
  validateSearch: zodValidator(customersSearchSchema),
  loaderDeps: ({ search }) => normalizeCustomersSearch(search),
  loader: async ({ context, deps }) => {
    const normalizedDeps = normalizeCustomersSearch(deps)
    return await context.queryClient.ensureQueryData(
      customersPaginatedQuery(normalizedDeps),
    )
  },
  component: CustomerList,
  pendingComponent: CustomersPending,
})

function CustomerList() {
  const { t } = useTranslation('entities')
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()

  const [modalState, setModalState] = useState<ModalState<Customer>>({
    type: 'closed',
  })
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), [])
  const openAddModal = useCallback(() => setModalState({ type: 'adding' }), [])
  const openEditModal = useCallback(
    (customer: Customer) => setModalState({ type: 'editing', item: customer }),
    [],
  )

  const deleteMutation = useDeleteCustomerMutation()

  const customersQ = useQuery(customersPaginatedQuery(search))
  const customersData = customersQ.data
  const {
    data: customers,
    total,
    pageIndex,
    pageSize,
  } = customersData ?? {
    data: [],
    total: 0,
    pageIndex: 0,
    pageSize: 100,
  }

  const pendingDeleteCustomer = useMemo(
    () =>
      pendingDeleteId === null
        ? null
        : (customers.find((customer) => customer.id === pendingDeleteId) ??
          null),
    [customers, pendingDeleteId],
  )

  const handleDeleteCustomer = useCallback(
    (id: number) => {
      if (deleteMutation.isPending) return
      setPendingDeleteId(id)
    },
    [deleteMutation.isPending],
  )

  const confirmDeleteCustomer = useCallback(() => {
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

  const deleteCustomerLabel = pendingDeleteCustomer
    ? `${pendingDeleteCustomer.code} - ${pendingDeleteCustomer.name}`
    : t('customers.fallback_label')

  const isDeleteDialogOpen = pendingDeleteId !== null

  useEffect(() => {
    if (pendingDeleteId !== null && !pendingDeleteCustomer) {
      setPendingDeleteId(null)
    }
  }, [pendingDeleteCustomer, pendingDeleteId])

  const handleSearchChange = useCallback(
    (updates: Partial<CustomersSearch>, replaceAll = false) => {
      navigate({
        search: (prev: CustomersSearch) => {
          const next: Record<string, any> = replaceAll
            ? { ...updates }
            : { ...prev, ...updates }

          Object.keys(next).forEach((k) => {
            if (next[k] === undefined) {
              delete next[k]
            }
          })

          return next as CustomersSearch
        },
        replace: true,
      })
    },
    [navigate],
  )

  const columns = useMemo(
    () => getColumns(openEditModal, handleDeleteCustomer, t),
    [handleDeleteCustomer, openEditModal, t],
  )

  return (
    <>
      <CustomerListHeader onAdd={openAddModal} />
      <CustomersDataTable
        customers={customers}
        columns={columns}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isFetching={customersQ.isFetching}
        search={search}
        onSearchChange={handleSearchChange}
        onPageChange={(p) => handleSearchChange({ pageIndex: p })}
        onPageSizeChange={(s) =>
          handleSearchChange({ pageSize: s, pageIndex: 0 })
        }
        onRowClick={(id) =>
          navigate({
            to: `/customers/$id`,
            params: { id: String(id) },
          })
        }
        allowedSortBy={customerSortFields}
      />

      {modalState.type !== 'closed' && (
        <CustomerForm
          item={modalState.type === 'editing' ? modalState.item : undefined}
          isSubmitting={false}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}

      <CustomerDeleteDialog
        open={isDeleteDialogOpen}
        isDeleting={deleteMutation.isPending}
        customerLabel={deleteCustomerLabel}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteCustomer}
      />
    </>
  )
}

function CustomersPending() {
  const { t } = useTranslation('entities')
  return <LoadingSpinner variant="full-page" text={t('customers.loading')} />
}
