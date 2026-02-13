import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import {
  getDeliveryById,
  getDeliveryFilterOptions,
  getLastDeliveryNumber,
  getPaginatedDeliveries,
} from '@/server/deliveries'
import { DeliveriesSearch } from '../types'

export const deliveryQueryKeys = {
  all: ['deliveries'] as const,

  lists: () => [...deliveryQueryKeys.all, 'list'] as const,

  list: (s: DeliveriesSearch) =>
    [
      ...deliveryQueryKeys.lists(),
      s.pageIndex ?? 0,
      s.pageSize ?? 100,
      s.q ?? '',
      s.sortBy ?? 'delivery_number',
      s.sortDir ?? 'asc',
      s.customerId ?? '',
      s.startDate ?? '',
      s.endDate ?? '',
    ] as const,

  details: () => [...deliveryQueryKeys.all, 'detail'] as const,

  detail: (id: number) => [...deliveryQueryKeys.details(), id] as const,

  lastNumber: () => ['last-delivery-number'] as const,

  filterOptions: () => ['delivery-filter-options'] as const,
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

export const lastDeliveryNumberQuery = () =>
  queryOptions({
    queryKey: deliveryQueryKeys.lastNumber(),
    queryFn: getLastDeliveryNumber,
  })

export const getFilterOptions = () =>
  queryOptions({
    queryKey: deliveryQueryKeys.filterOptions(),
    queryFn: getDeliveryFilterOptions,
    staleTime: Infinity,
  })
