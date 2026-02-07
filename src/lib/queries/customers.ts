// src/lib/queries/customers.ts
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { CustomersSearch } from '../types'
import {
  getCustomerById,
  getCustomers,
  getPaginatedCustomers,
} from '@/server/customers'

export const fetchCustomers = queryOptions({
  queryKey: ['customers'],
  queryFn: getCustomers,
  staleTime: 1000 * 60 * 10,
})

export function useFetchCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    staleTime: 1000 * 60 * 10,
  })
}

export const customersQueryKey = (s: CustomersSearch) =>
  [
    'customers',
    'list',
    s.pageIndex ?? 0,
    s.pageSize ?? 100,
    s.q ?? '',
    s.sortBy ?? 'code',
    s.sortDir ?? 'asc',
  ] as const

export const customersQuery = (search: CustomersSearch) =>
  queryOptions({
    queryKey: customersQueryKey(search),
    queryFn: () =>
      getPaginatedCustomers({
        data: {
          ...search,
        },
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  })

export const customerQuery = (id: number) =>
  queryOptions({
    queryKey: ['customers', 'detail', id],
    queryFn: () => getCustomerById({ data: { id } }),
  })
