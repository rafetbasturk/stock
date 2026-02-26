// src/routes/products/index.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-adapter'
import { useTranslation } from 'react-i18next'

import type { ProductListRow } from '@/types'
import type { ProductsSearch } from '@/lib/types/types.search'
import type { DataTableFilter } from '@/components/datatable/types'
import type { ModalState } from '@/lib/types/types.modal'
import { useDeleteProductMutation } from '@/lib/mutations/products'
import { getFilterOptions, productsQuery } from '@/lib/queries/products'
import {
  productSortFields,
  productsSearchSchema,
} from '@/lib/types/types.search'

import { getColumns } from '@/components/products/columns'
import ProductForm from '@/components/products/ProductForm'
import { ProductDeleteDialog } from '@/components/products/ProductDeleteDialog'
import { ProductListHeader } from '@/components/products/ProductListHeader'
import { ProductsDataTable } from '@/components/products/ProductsDataTable'
import { StockMovementDialog } from '@/components/stock/StockMovementDialog'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { ListPendingComponent } from '@/components/ListPendingComponent'

export const Route = createFileRoute('/products/')({
  validateSearch: zodValidator(productsSearchSchema),
  loader: async ({ context }) => {
    return await context.queryClient.prefetchQuery(getFilterOptions())
  },
  component: ProductList,
  pendingComponent: ListPendingComponent,
})

function ProductList() {
  const { t } = useTranslation('entities')
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()

  // Modal state using discriminated union
  const [modalState, setModalState] = useState<ModalState<ProductListRow>>({
    type: 'closed',
  })
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const closeModal = useCallback(() => setModalState({ type: 'closed' }), [])
  const openAddModal = useCallback(() => setModalState({ type: 'adding' }), [])
  const openEditModal = useCallback(
    (product: ProductListRow) =>
      setModalState({ type: 'editing', item: product }),
    [],
  )
  const openAdjustModal = useCallback(
    (product: ProductListRow) =>
      setModalState({ type: 'adjusting', item: product }),
    [],
  )

  const deleteMutation = useDeleteProductMutation()

  const { data: filterOptions } = useSuspenseQuery(getFilterOptions())

  const productsQ = useQuery(productsQuery(search))

  const productsData = productsQ.data
  const products = productsData?.data ?? []
  const total = productsData?.total ?? 0
  const pageIndex = productsData?.pageIndex ?? search.pageIndex
  const pageSize = productsData?.pageSize ?? search.pageSize

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
  const customFilters: Array<DataTableFilter> = useMemo(() => {
    const filters: Array<DataTableFilter> = [
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
    ]

    if (filterOptions.customers.length > 1) {
      filters.push({
        columnId: 'customerId',
        label: t('products.filters.customer'),
        type: 'multi',
        options: filterOptions.customers.map((c) => ({
          value: String(c.id),
          label: c.name,
        })),
      })
    }

    return filters
  }, [filterOptions.customers, filterOptions.materials, t])

  const handleSearchChange = useCallback(
    (updates: Partial<ProductsSearch>, replaceAll = false) => {
      navigate({
        search: (prev: ProductsSearch) => {
          const next: Record<string, any> = replaceAll
            ? { ...updates }
            : { ...prev, ...updates }

          Object.keys(next).forEach((k) => {
            if (next[k] === undefined) {
              delete next[k]
            }
          })

          return next as ProductsSearch
        },
        replace: true,
      })
    },
    [navigate],
  )

  return (
    <ListPageLayout header={<ProductListHeader onAdd={openAddModal} />}>
      <ProductsDataTable
        products={products}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isFetching={productsQ.isFetching}
        search={search}
        columns={columns}
        customFilters={customFilters}
        onSearchChange={handleSearchChange}
        onPageChange={(p) => handleSearchChange({ pageIndex: p })}
        onPageSizeChange={(s) =>
          handleSearchChange({ pageSize: s, pageIndex: 0 })
        }
        onRowClick={(id) =>
          navigate({
            to: `/products/$id`,
            params: { id: String(id) },
          })
        }
        allowedSortBy={productSortFields}
      />

      {(modalState.type === 'adding' || modalState.type === 'editing') && (
        <ProductForm
          item={modalState.type === 'editing' ? modalState.item : undefined}
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

      <StockMovementDialog
        mode="adjust"
        product={modalState.type === 'adjusting' ? modalState.item : null}
        open={modalState.type === 'adjusting'}
        onOpenChange={(open) => !open && closeModal()}
        onSuccess={() => {
          closeModal()
          productsQ.refetch()
        }}
      />
    </ListPageLayout>
  )
}
