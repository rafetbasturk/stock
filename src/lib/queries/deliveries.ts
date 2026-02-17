import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import {
  getDeliveryById,
  getDeliveryFilterOptions,
  getLastDeliveryNumber,
  getPaginatedDeliveries,
} from '@/server/deliveries'
import { DeliveriesSearch } from '../types'

const normalizedSearch = (search: DeliveriesSearch) => ({
  pageIndex: search.pageIndex ?? 0,
  pageSize: search.pageSize ?? 100,
  q: search.q ?? '',
  sortBy: search.sortBy ?? 'delivery_number',
  sortDir: search.sortDir ?? 'desc',
  customerId: search.customerId ?? '',
  startDate: search.startDate ?? '',
  endDate: search.endDate ?? '',
})

export const deliveryQueryKeys = {
  all: ['deliveries'] as const,

  lists: () => [...deliveryQueryKeys.all, 'list'] as const,

  list: (search: DeliveriesSearch) =>
    [...deliveryQueryKeys.lists(), normalizedSearch(search)] as const,

  paginatedLists: () => [...deliveryQueryKeys.all, 'paginated'] as const,

  paginatedList: (search: DeliveriesSearch) =>
    [...deliveryQueryKeys.paginatedLists(), normalizedSearch(search)] as const,

  details: () => [...deliveryQueryKeys.all, 'detail'] as const,

  detail: (id: number) => [...deliveryQueryKeys.details(), id] as const,

  lastNumber: () => [...deliveryQueryKeys.all, 'lastNumber'] as const,

  filterOptions: () => [...deliveryQueryKeys.all, 'filterOptions'] as const,
}

export const deliveriesQuery = (search: DeliveriesSearch) => {
  const normalized = normalizedSearch(search)

  return queryOptions({
    queryKey: deliveryQueryKeys.list(search),
    queryFn: () =>
      getPaginatedDeliveries({
        data: normalized,
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  })
}

export const deliveryQuery = (id: number) =>
  queryOptions({
    queryKey: deliveryQueryKeys.detail(id),
    queryFn: () => getDeliveryById({ data: { id } }),
  })

export const lastDeliveryNumberQuery = queryOptions({
  queryKey: deliveryQueryKeys.lastNumber(),
  queryFn: getLastDeliveryNumber,
})

export const getFilterOptions = queryOptions({
  queryKey: deliveryQueryKeys.filterOptions(),
  queryFn: getDeliveryFilterOptions,
  staleTime: Infinity,
})
