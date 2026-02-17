// src/lib/queries/products.ts
import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { ProductsSearch } from '../types/types.search'
import {
  getPaginated,
  getProductById,
  getProductFilterOptions,
  getProducts,
} from '@/server/products'

const normalizedSearch = (search: ProductsSearch) => ({
  pageIndex: search.pageIndex ?? 0,
  pageSize: search.pageSize ?? 100,
  q: search.q ?? '',
  sortBy: search.sortBy ?? 'code',
  sortDir: search.sortDir ?? 'asc',
  material: search.material ?? '',
  customerId: search.customerId ?? '',
})

export const productQueryKeys = {
  all: ['products'] as const,

  lists: () => [...productQueryKeys.all, 'list'] as const,

  list: (search: ProductsSearch) =>
    [...productQueryKeys.lists(), normalizedSearch(search)] as const,

  paginatedLists: () => [...productQueryKeys.all, 'paginated'] as const,

  paginatedList: (search: ProductsSearch) =>
    [...productQueryKeys.paginatedLists(), normalizedSearch(search)] as const,

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
  queryFn: getProducts,
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
    queryFn: getProductFilterOptions,
    staleTime: Infinity,
  })
