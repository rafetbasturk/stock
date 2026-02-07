import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { OrdersSearch } from '../types/types.search'
import {
  getOrderById,
  getPaginatedOrders,
  getYearRange,
} from '@/server/orders'

export const yearRangeQuery = queryOptions({
  queryKey: ['year-range'],
  queryFn: getYearRange,
})

export const ordersQueryKey = (s: OrdersSearch) =>
  [
    'orders',
    'list',
    s.pageIndex ?? 0,
    s.pageSize ?? 100,
    s.q ?? '',
    s.sortBy ?? 'order_number',
    s.sortDir ?? 'asc',
    s.status ?? '',
    s.customerId ?? '',
    s.startDate ?? '',
    s.endDate ?? '',
  ] as const

export const ordersQuery = (search: OrdersSearch) =>
  queryOptions({
    queryKey: ordersQueryKey(search),
    queryFn: () =>
      getPaginatedOrders({
        data: {
          ...search,
        },
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  })

export const orderQuery = (id: number) =>
  queryOptions({
    queryKey: ['orders', 'detail', id],
    queryFn: () => getOrderById({ data: { id } }),
  })
