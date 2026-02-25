import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import {
  normalizeDeliveriesSearch,
} from '../types/types.search'
import type {
  DeliveriesSearch} from '../types/types.search';
import {
  getDeliveryById,
  getDeliveryFilterOptions,
  getLastDeliveryNumber,
  getLastReturnDeliveryNumber,
  getPaginatedDeliveries,
} from '@/server/deliveries'

export const deliveryQueryKeys = {
  all: ['deliveries'] as const,

  lists: () => [...deliveryQueryKeys.all, 'list'] as const,

  list: (search: DeliveriesSearch) =>
    [...deliveryQueryKeys.lists(), normalizeDeliveriesSearch(search)] as const,

  paginatedLists: () => [...deliveryQueryKeys.all, 'paginated'] as const,

  paginatedList: (search: DeliveriesSearch) =>
    [
      ...deliveryQueryKeys.paginatedLists(),
      normalizeDeliveriesSearch(search),
    ] as const,

  details: () => [...deliveryQueryKeys.all, 'detail'] as const,

  detail: (id: number) => [...deliveryQueryKeys.details(), id] as const,

  lastNumber: () => [...deliveryQueryKeys.all, 'lastNumber'] as const,
  lastReturnNumber: () => [...deliveryQueryKeys.all, 'lastReturnNumber'] as const,

  filterOptions: () => [...deliveryQueryKeys.all, 'filterOptions'] as const,
}

export const deliveriesQuery = (search: DeliveriesSearch) =>
  queryOptions({
    queryKey: deliveryQueryKeys.list(search),
    queryFn: () =>
      getPaginatedDeliveries({
        data: search,
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  })

export const deliveryQuery = (id: number) =>
  queryOptions({
    queryKey: deliveryQueryKeys.detail(id),
    queryFn: () => getDeliveryById({ data: { id } }),
  })

export const lastDeliveryNumberQuery = queryOptions({
  queryKey: deliveryQueryKeys.lastNumber(),
  queryFn: () => getLastDeliveryNumber(),
})

export const lastReturnDeliveryNumberQuery = queryOptions({
  queryKey: deliveryQueryKeys.lastReturnNumber(),
  queryFn: () => getLastReturnDeliveryNumber(),
})

export const getFilterOptions = queryOptions({
  queryKey: deliveryQueryKeys.filterOptions(),
  queryFn: () => getDeliveryFilterOptions(),
  staleTime: Infinity,
})
