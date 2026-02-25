// src/lib/queries/products.ts
import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { normalizeProductsSearch } from '../types/types.search'
import type { ProductsSearch } from '../types/types.search'
import {
  getPaginated,
  getProductById,
  getProductFilterOptions,
  getProducts,
} from '@/server/products'

export const productQueryKeys = {
  all: ['products'] as const,

  lists: () => [...productQueryKeys.all, 'list'] as const,

  list: (search: ProductsSearch) =>
    [...productQueryKeys.lists(), normalizeProductsSearch(search)] as const,

  paginatedLists: () => [...productQueryKeys.all, 'paginated'] as const,

  paginatedList: (search: ProductsSearch) =>
    [
      ...productQueryKeys.paginatedLists(),
      normalizeProductsSearch(search),
    ] as const,

  details: () => [...productQueryKeys.all, 'detail'] as const,

  detail: (id: number) => [...productQueryKeys.details(), id] as const,

  filterOptions: () => [...productQueryKeys.all, 'filterOptions'] as const,

  select: () => [...productQueryKeys.all, 'select'] as const,
}

export const productsQuery = (search: ProductsSearch) =>
  queryOptions({
    queryKey: productQueryKeys.paginatedList(search),
    queryFn: () =>
      getPaginated({
        data: search,
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  })

export const selectProductsQuery = queryOptions({
  queryKey: productQueryKeys.select(),
  queryFn: () => getProducts(),
  staleTime: 1000 * 60 * 10,
})

export const productQuery = (id: number) =>
  queryOptions({
    queryKey: productQueryKeys.detail(id),
    queryFn: () => getProductById({ data: { id } }),
  })

export const getFilterOptions = () =>
  queryOptions({
    queryKey: productQueryKeys.filterOptions(),
    queryFn: () => getProductFilterOptions(),
    staleTime: Infinity,
  })
