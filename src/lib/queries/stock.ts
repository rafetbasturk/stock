import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { StockSearch } from '../types/types.search'
import { getStockMovements } from '@/server/stock'

export const stockQueryKeys = {
  all: ['stock'] as const,

  lists: () => [...stockQueryKeys.all, 'list'] as const,

  list: (s: StockSearch) =>
    [
      ...stockQueryKeys.lists(),
      s.pageIndex ?? 0,
      s.pageSize ?? 20,
      s.q ?? '',
      s.movementType ?? '',
      s.productId ?? '',
    ] as const,

  details: () => [...stockQueryKeys.all, 'detail'] as const,

  detail: (id: number) => [...stockQueryKeys.details(), id] as const,
}

export const stockQuery = (search: StockSearch) =>
  queryOptions({
    queryKey: stockQueryKeys.list(search),
    queryFn: () =>
      getStockMovements({
        data: {
          page: search.pageIndex,
          pageSize: search.pageSize,
          q: search.q,
          movementType: search.movementType,
          product_id: search.productId,
        },
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  })
