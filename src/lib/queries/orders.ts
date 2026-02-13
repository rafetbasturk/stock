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

export const orderQueryKeys = {
  all: ['orders'] as const,

  lists: () => [...orderQueryKeys.all, 'list'] as const,

  list: (search: OrdersSearch) =>
    [
      ...orderQueryKeys.lists(),
      search.pageIndex ?? 0,
      search.pageSize ?? 100,
      search.q ?? '',
      search.sortBy ?? 'order_number',
      search.sortDir ?? 'asc',
      search.status ?? '',
      search.customerId ?? '',
      search.startDate ?? '',
      search.endDate ?? '',
    ] as const,

  details: () => [...orderQueryKeys.all, 'detail'] as const,

  detail: (id: number) => [...orderQueryKeys.details(), id] as const,

  deliveries: (id: number) =>
    [...orderQueryKeys.detail(id), 'deliveries'] as const,

  lastNumber: () => ['last-order-number'] as const,

  filterOptions: () => ['orders-filter-options'] as const,

  yearRange: () => ['year-range'] as const,

  select: () => [...orderQueryKeys.all, 'select'],
}

export const ordersQuery = (search: OrdersSearch) =>
  queryOptions({
    queryKey: orderQueryKeys.list(search),
    queryFn: () =>
      getPaginatedOrders({
        data: search,
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  })

export const ordersSelectQuery = queryOptions({
  queryKey: orderQueryKeys.select(),
  queryFn: getOrders,
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

export const lastOrderNumberQuery = () =>
  queryOptions({
    queryKey: orderQueryKeys.lastNumber(),
    queryFn: getLastOrderNumber,
  })

export const getFilterOptions = () =>
  queryOptions({
    queryKey: orderQueryKeys.filterOptions(),
    queryFn: getOrderFilterOptions,
    staleTime: Infinity,
  })

export const yearRangeQuery = queryOptions({
  queryKey: orderQueryKeys.yearRange(),
  queryFn: getYearRange,
})
