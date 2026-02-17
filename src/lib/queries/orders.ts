import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { OrdersSearch } from '../types/types.search'
import {
  getLastOrderNumber,
  getOrderById,
  getOrderDeliveries,
  getOrderFilterOptions,
  getOrders,
  getPaginatedOrders,
  getYearRange,
} from '@/server/orders'

import { normalizeOrdersSearch } from '../types/types.search'

export const orderQueryKeys = {
  all: ['orders'] as const,

  lists: () => [...orderQueryKeys.all, 'list'] as const,

  list: (search: OrdersSearch) =>
    [...orderQueryKeys.lists(), normalizeOrdersSearch(search)] as const,

  paginatedLists: () => [...orderQueryKeys.all, 'paginated'] as const,

  paginatedList: (search: OrdersSearch) =>
    [
      ...orderQueryKeys.paginatedLists(),
      normalizeOrdersSearch(search),
    ] as const,

  details: () => [...orderQueryKeys.all, 'detail'] as const,

  detail: (id: number) => [...orderQueryKeys.details(), id] as const,

  deliveries: (id: number) =>
    [...orderQueryKeys.detail(id), 'deliveries'] as const,

  lastNumber: () => [...orderQueryKeys.all, 'lastNumber'] as const,

  filterOptions: () => [...orderQueryKeys.all, 'filterOptions'] as const,

  yearRange: () => [...orderQueryKeys.all, 'yearRange'] as const,

  select: () => [...orderQueryKeys.all, 'select'] as const,
}

export const ordersQuery = (search: OrdersSearch) =>
  queryOptions({
    queryKey: orderQueryKeys.paginatedList(search),
    queryFn: () =>
      getPaginatedOrders({
        data: search,
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  })

export const orderQuery = (id: number) =>
  queryOptions({
    queryKey: orderQueryKeys.detail(id),
    queryFn: () => getOrderById({ data: { id } }),
  })

export const orderDeliveriesQuery = (orderId: number) =>
  queryOptions({
    queryKey: orderQueryKeys.deliveries(orderId),
    queryFn: () => getOrderDeliveries({ data: { orderId } }),
  })

export const ordersSelectQuery = queryOptions({
  queryKey: orderQueryKeys.select(),
  queryFn: getOrders,
})

export const lastOrderNumberQuery = queryOptions({
  queryKey: orderQueryKeys.lastNumber(),
  queryFn: getLastOrderNumber,
})

export const getFilterOptions = queryOptions({
  queryKey: orderQueryKeys.filterOptions(),
  queryFn: getOrderFilterOptions,
  staleTime: Infinity,
})

export const yearRangeQuery = queryOptions({
  queryKey: orderQueryKeys.yearRange(),
  queryFn: getYearRange,
})
