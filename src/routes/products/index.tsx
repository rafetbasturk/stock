// src/routes/products/index.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-adapter'
import { useTranslation } from 'react-i18next'

import type { ProductListRow } from '@/types'
import type { DataTableFilter } from '@/components/DataTable'
import type { ProductsSearch } from '@/lib/types/types.search'
import { debounce } from '@/lib/debounce'
import { useDeleteProductMutation } from '@/lib/mutations/products'
import { getFilterOptions, productsQuery } from '@/lib/queries/products'
import {
  normalizeProductsSearch,
  productsSearchSchema,
} from '@/lib/types/types.search'

import { getColumns } from '@/components/products/columns'
import ProductForm from '@/components/products/ProductForm'
import { ProductDeleteDialog } from '@/components/products/ProductDeleteDialog'
import { ProductListHeader } from '@/components/products/ProductListHeader'
import { ProductsDataTable } from '@/components/products/ProductsDataTable'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { StockAdjustmentDialog } from '@/components/stock/StockAdjustmentDialog'
import { ProductsModalState } from '@/lib/types/types.modal'

export const Route = createFileRoute('/products/')({
  validateSearch: zodValidator(productsSearchSchema),
  loaderDeps: ({ search }) => normalizeProductsSearch(search),
  loader: async ({ context, deps }) => {
    return await Promise.all([
      context.queryClient.prefetchQuery(getFilterOptions()),
      context.queryClient.ensureQueryData(productsQuery(deps)),
    ])
  },
  component: ProductList,
  pendingComponent: ProductsPending,
})

function ProductList() {
  const { t } = useTranslation('entities')
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()

  // Modal state using discriminated union
  const [modalState, setModalState] = useState<ProductsModalState>({
    type: 'closed',
  })
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), [])
  const openAddModal = useCallback(() => setModalState({ type: 'adding' }), [])
  const openEditModal = useCallback(
    (product: ProductListRow) => setModalState({ type: 'editing', product }),
    [],
  )
  const openAdjustModal = useCallback(
    (product: ProductListRow) => setModalState({ type: 'adjusting', product }),
    [],
  )

  const deleteMutation = useDeleteProductMutation()

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
    : t('products.fallback_label')

  const isDeleteDialogOpen = pendingDeleteId !== null

  useEffect(() => {
    if (pendingDeleteId !== null && !pendingDeleteProduct) {
      setPendingDeleteId(null)
    }
  }, [pendingDeleteId, pendingDeleteProduct])

  const columns = useMemo(
    () => getColumns(openEditModal, handleDeleteProduct, openAdjustModal, t),
    [handleDeleteProduct, openEditModal, openAdjustModal, t],
  )

  // Memoize customFilters with filtered empty materials
  const customFilters: Array<DataTableFilter> = useMemo(
    () => [
      {
        columnId: 'material',
        label: t('products.filters.material'),
        type: 'multi',
        options: filterOptions.materials
          .filter((m) => m && m.trim().length > 0)
          .map((m) => ({
            value: m,
            label: m,
          })),
      },
    ],
    [filterOptions.customers, filterOptions.materials, t],
  )

  // Handle search changes with proper type safety
  const handleSearchChange = useCallback(
    (updates: Record<string, string | number | undefined>) => {
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

      {(modalState.type === 'adding' || modalState.type === 'editing') && (
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

      <StockAdjustmentDialog
        product={modalState.type === 'adjusting' ? modalState.product : null}
        open={modalState.type === 'adjusting'}
        onOpenChange={(open) => !open && closeModal()}
        onSuccess={() => {
          closeModal()
          productsQ.refetch()
        }}
      />
    </>
  )
}

function ProductsPending() {
  const { t } = useTranslation('entities')
  return <LoadingSpinner variant="full-page" text={t('products.loading')} />
}
