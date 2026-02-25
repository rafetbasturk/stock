import { useCallback, useMemo } from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useTranslation } from 'react-i18next'
import type { ProductDemandSearch } from '@/lib/types/types.search'
import type { Language } from '@/lib/types/types.settings'
import type { DataTableFilter } from '@/components/datatable/types'

import { useAppTimeZone } from '@/hooks/useAppTimeZone'
import { customersListQuery } from '@/lib/queries/customers'
import { productDemandQuery } from '@/lib/queries/productDemand'
import {
  productDemandSearchSchema,
  productDemandSortFields,
} from '@/lib/types/types.search'

import PageHeader from '@/components/PageHeader'
import { getColumns } from '@/components/product-demand/columns'
import { ProductDemandDataTable } from '@/components/product-demand/ProductDemandDataTable'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export const Route = createFileRoute('/product-demand/')({
  validateSearch: zodValidator(productDemandSearchSchema),
  loader: async ({ context }) => {
    return await context.queryClient.prefetchQuery(
      customersListQuery({ distinct: true }),
    )
  },
  component: RouteComponent,
  pendingComponent: () => {
    const { t } = useTranslation('entities')
    return (
      <LoadingSpinner variant="full-page" text={t('productDemand.loading')} />
    )
  },
})

function RouteComponent() {
  const { t, i18n } = useTranslation('entities')
  const timeZone = useAppTimeZone()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const customerOptionsQ = useSuspenseQuery(
    customersListQuery({ distinct: true }),
  )

  const demandQ = useQuery(productDemandQuery(search))

  const demandData = demandQ.data

  const demand = demandData?.data ?? []
  const total = demandData?.total ?? 0
  const pageIndex = demandData?.pageIndex ?? search.pageIndex
  const pageSize = demandData?.pageSize ?? search.pageSize

  const columns = useMemo(
    () => getColumns(t, i18n.language as Language, timeZone),
    [t, i18n.language, timeZone],
  )

  const customFilters: Array<DataTableFilter> = useMemo(
    () => [
      {
        columnId: 'customerId',
        label: t('productDemand.filters.customer'),
        type: 'select',
        options: customerOptionsQ.data.map((customer) => ({
          value: String(customer.id),
          label: `${customer.code} - ${customer.name}`,
        })),
      },
      {
        columnId: 'dateRange',
        label: t('productDemand.filters.daterange'),
        type: 'daterange',
      },
    ],
    [customerOptionsQ.data, t],
  )

  const handleSearchChange = useCallback(
    (updates: Partial<ProductDemandSearch>, replaceAll = false) => {
      navigate({
        search: (prev: ProductDemandSearch) => {
          const next: Record<string, any> = replaceAll
            ? { ...updates }
            : { ...prev, ...updates }

          Object.keys(next).forEach((k) => {
            if (next[k] === undefined) {
              delete next[k]
            }
          })

          return next as ProductDemandSearch
        },
        replace: true,
      })
    },
    [navigate],
  )

  return (
    <>
      <PageHeader
        title={t('productDemand.list_title')}
        description={t('productDemand.description')}
        showBack
      />

      <ProductDemandDataTable
        data={demand}
        columns={columns}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isFetching={demandQ.isFetching}
        customFilters={customFilters}
        search={search}
        onSearchChange={handleSearchChange}
        onPageChange={(p) => handleSearchChange({ pageIndex: p })}
        onPageSizeChange={(s) =>
          handleSearchChange({ pageSize: s, pageIndex: 0 })
        }
        allowedSortBy={productDemandSortFields}
      />
    </>
  )
}
