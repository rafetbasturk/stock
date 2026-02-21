import { useCallback, useEffect, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useTranslation } from 'react-i18next'
import type { DataTableFilter } from '@/components/DataTable'
import type { ProductDemandSearch } from '@/lib/types/types.search'
import PageHeader from '@/components/PageHeader'
import { getColumns } from '@/components/product-demand/columns'
import { ProductDemandDataTable } from '@/components/product-demand/ProductDemandDataTable'
import { debounce } from '@/lib/debounce'
import { customersListQuery } from '@/lib/queries/customers'
import { productDemandQuery } from '@/lib/queries/productDemand'
import {
  normalizeProductDemandSearch,
  productDemandSearchSchema,
} from '@/lib/types/types.search'
import { Language } from '@/lib/types/types.settings'

export const Route = createFileRoute('/product-demand/')({
  validateSearch: zodValidator(productDemandSearchSchema),
  loaderDeps: ({ search }) => normalizeProductDemandSearch(search),
  loader: async ({ context, deps }) => {
    return await Promise.all([
      context.queryClient.prefetchQuery(customersListQuery({ distinct: true })),
      context.queryClient.ensureQueryData(productDemandQuery(deps)),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { t, i18n } = useTranslation('entities')
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const demandQ = useSuspenseQuery(productDemandQuery(search))
  const customerOptionsQ = useSuspenseQuery(
    customersListQuery({ distinct: true }),
  )

  const { data, pageIndex, pageSize, total } = demandQ.data

  const columns = useMemo(
    () => getColumns(t, i18n.language as Language),
    [t, i18n.language],
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
    (updates: Record<string, string | number | undefined>) => {
      navigate({
        search: (prev: ProductDemandSearch) => {
          const merged = { ...prev, ...updates } as Record<string, any>
          Object.keys(merged).forEach(
            (key) => merged[key] === undefined && delete merged[key],
          )
          return merged as ProductDemandSearch
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
      <PageHeader
        title={t('productDemand.list_title')}
        description={t('productDemand.description')}
        showBack
      />

      <ProductDemandDataTable
        data={data}
        columns={columns}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isFetching={demandQ.isFetching}
        search={search}
        customFilters={customFilters}
        onSearchChange={debouncedSearchChange}
        onPageChange={(p) => handleSearchChange({ pageIndex: String(p) })}
        onPageSizeChange={(s) =>
          handleSearchChange({ pageSize: String(s), pageIndex: '0' })
        }
      />
    </>
  )
}
