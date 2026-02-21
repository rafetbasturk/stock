import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { normalizeProductDemandSearch } from '../types/types.search'
import type { ProductDemandSearch } from '../types/types.search'
import { getPaginatedProductDemand } from '@/server/productDemand'

export const productDemandQueryKeys = {
  all: ['productDemand'] as const,

  paginatedLists: () => [...productDemandQueryKeys.all, 'paginated'] as const,

  paginatedList: (search: ProductDemandSearch) =>
    [
      ...productDemandQueryKeys.paginatedLists(),
      normalizeProductDemandSearch(search),
    ] as const,
}

export const productDemandQuery = (search: ProductDemandSearch) =>
  queryOptions({
    queryKey: productDemandQueryKeys.paginatedList(search),
    queryFn: () =>
      getPaginatedProductDemand({
        data: search,
      }),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
