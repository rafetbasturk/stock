// src/routes/products/index.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-adapter'
import { toast } from 'sonner'

import type { ProductListRow } from '@/types'
import type { DataTableFilter } from '@/components/DataTable'
import type { ProductsSearch } from '@/lib/types/types.search'
import { debounce } from '@/lib/debounce'
import { useDeleteProductMutation } from '@/lib/mutations/products'
import { getFilterOptions, productsQuery } from '@/lib/queries/products'
import { productsSearchSchema } from '@/lib/types/types.search'

import { getColumns } from '@/components/products/columns'
import ProductForm from '@/components/products/ProductForm'
import { ProductDeleteDialog } from '@/components/products/ProductDeleteDialog'
import { ProductListHeader } from '@/components/products/ProductListHeader'
import { ProductsDataTable } from '@/components/products/ProductsDataTable'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export const Route = createFileRoute('/products/')({
  validateSearch: zodValidator(productsSearchSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    return await Promise.all([
      context.queryClient.prefetchQuery(getFilterOptions()),
      context.queryClient.ensureQueryData(
        productsQuery(deps as ProductsSearch),
      ),
    ])
  },
  component: ProductList,
  pendingComponent: () => (
    <LoadingSpinner variant="full-page" text="Loading products..." />
  ),
})

function ProductList() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()

  // Modal state using discriminated union
  const [modalState, setModalState] = useState<
    | { type: 'closed' }
    | { type: 'adding' }
    | { type: 'editing'; product: ProductListRow }
  >({ type: 'closed' })
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), [])
  const openAddModal = useCallback(() => setModalState({ type: 'adding' }), [])
  const openEditModal = useCallback(
    (product: ProductListRow) => setModalState({ type: 'editing', product }),
    [],
  )

  const deleteMutation = useDeleteProductMutation()

  // Error handling for delete mutation
  useEffect(() => {
    if (deleteMutation.isError) {
      toast.error('Failed to delete product')
    }
  }, [deleteMutation.isError])

  const { data: filterOptions } = useSuspenseQuery(getFilterOptions())

  const productsQ = useSuspenseQuery(productsQuery(search))
  const { data: products, total, pageIndex, pageSize } = productsQ.data

  const pendingDeleteProduct = useMemo(
    () =>
      pendingDeleteId === null
        ? null
        : (products.find((product) => product.id === pendingDeleteId) ?? null),
    [pendingDeleteId, products],
  )

  const handleDeleteProduct = useCallback(
    (id: number) => {
      if (deleteMutation.isPending) return
      setPendingDeleteId(id)
    },
    [deleteMutation],
  )

  const confirmDeleteProduct = useCallback(() => {
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

  const deleteProductLabel = pendingDeleteProduct
    ? `${pendingDeleteProduct.code} - ${pendingDeleteProduct.name}`
    : 'Bu ürün'

  const isDeleteDialogOpen = pendingDeleteId !== null

  useEffect(() => {
    if (pendingDeleteId !== null && !pendingDeleteProduct) {
      setPendingDeleteId(null)
    }
  }, [pendingDeleteId, pendingDeleteProduct])

  const columns = useMemo(
    () => getColumns(openEditModal, handleDeleteProduct),
    [handleDeleteProduct, openEditModal],
  )

  // Memoize customFilters with filtered empty materials
  const customFilters: Array<DataTableFilter> = useMemo(
    () => [
      {
        columnId: 'customer',
        label: 'Müşteri',
        type: 'select',
        options: filterOptions.customers.map((c) => ({
          value: String(c.id),
          label: c.name,
        })),
      },
      {
        columnId: 'material',
        label: 'Malzeme',
        type: 'select',
        options: filterOptions.materials
          .filter((m) => m && m.trim().length > 0)
          .map((m) => ({
            value: m,
            label: m,
          })),
      },
    ],
    [filterOptions.customers, filterOptions.materials],
  )

  // Handle search changes with proper type safety
  const handleSearchChange = useCallback(
    (updates: Record<string, string | undefined>) => {
      navigate({
        search: (prev: ProductsSearch) => {
          const merged = { ...prev, ...updates } as Record<string, any>
          Object.keys(merged).forEach(
            (k) => merged[k] === undefined && delete merged[k],
          )
          return merged as ProductsSearch
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

  return (
    <>
      <ProductListHeader onAdd={openAddModal} />
      <ProductsDataTable
        products={products}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isFetching={productsQ.isFetching}
        search={search}
        columns={columns}
        customFilters={customFilters}
        onSearchChange={debouncedSearchChange}
        onPageChange={(p) => handleSearchChange({ pageIndex: String(p) })}
        onPageSizeChange={(s) =>
          handleSearchChange({ pageSize: String(s), pageIndex: '0' })
        }
        onRowClick={(id) =>
          navigate({
            to: `/products/$id`,
            params: { id: String(id) },
          })
        }
      />

      {modalState.type !== 'closed' && (
        <ProductForm
          item={modalState.type === 'editing' ? modalState.product : undefined}
          isSubmitting={false}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}

      <ProductDeleteDialog
        open={isDeleteDialogOpen}
        isDeleting={deleteMutation.isPending}
        productLabel={deleteProductLabel}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteProduct}
      />
    </>
  )
}
