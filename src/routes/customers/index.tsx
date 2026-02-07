import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CustomersSearch } from '@/lib/types'
import type { Customer } from '@/types'
import { CustomerDeleteDialog } from '@/components/customers/CustomerDeleteDialog'
import CustomerForm from '@/components/customers/CustomerForm'
import { getColumns } from '@/components/customers/columns'
import { CustomerListHeader } from '@/components/customers/CustomerListHeader'
import { CustomersDataTable } from '@/components/customers/CustomersDataTable'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { debounce } from '@/lib/debounce'
import { useDeleteCustomerMutation } from '@/lib/mutations/customers'
import { customersQuery } from '@/lib/queries/customers'
import { customersSearchSchema } from '@/lib/types'

export const Route = createFileRoute('/customers/')({
  validateSearch: zodValidator(customersSearchSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    return await context.queryClient.ensureQueryData(customersQuery(deps))
  },
  component: CustomerList,
  pendingComponent: CustomersPending,
})

function CustomerList() {
  const { t } = useTranslation('entities')
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()

  const [modalState, setModalState] = useState<
    | { type: 'closed' }
    | { type: 'adding' }
    | { type: 'editing'; customer: Customer }
  >({ type: 'closed' })
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), [])
  const openAddModal = useCallback(() => setModalState({ type: 'adding' }), [])
  const openEditModal = useCallback(
    (customer: Customer) => setModalState({ type: 'editing', customer }),
    [],
  )

  const deleteMutation = useDeleteCustomerMutation()

  const customersQ = useSuspenseQuery(customersQuery(search))
  const { data: customers, total, pageIndex, pageSize } = customersQ.data

  const pendingDeleteCustomer = useMemo(
    () =>
      pendingDeleteId === null
        ? null
        : (customers.find((customer) => customer.id === pendingDeleteId) ?? null),
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

  // Handle search changes with proper type safety
  const handleSearchChange = useCallback(
    (updates: Record<string, string | undefined>) => {
      navigate({
        search: (prev: CustomersSearch) => {
          const merged = { ...prev, ...updates } as Record<string, any>
          Object.keys(merged).forEach(
            (k) => merged[k] === undefined && delete merged[k],
          )
          return merged as CustomersSearch
        },
        replace: true,
      })
    },
    [navigate],
  )

  // Stable debounced search callback
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
        onSearchChange={debouncedSearchChange}
        onPageChange={(p) => handleSearchChange({ pageIndex: String(p) })}
        onPageSizeChange={(s) =>
          handleSearchChange({ pageSize: String(s), pageIndex: '0' })
        }
        onRowClick={(id) =>
          navigate({
            to: `/customers/$id`,
            params: { id: String(id) },
          })
        }
      />

      {modalState.type !== 'closed' && (
        <CustomerForm
          item={modalState.type === 'editing' ? modalState.customer : undefined}
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
