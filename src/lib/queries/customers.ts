import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { CustomersSearch } from '../types'
import {
  getAllCustomers,
  getCustomerById,
  getPaginatedCustomers,
  getDistinctCustomers,
} from '@/server/customers'

type CustomerListFilters = {
  distinct?: boolean
}

import { normalizeCustomersSearch } from '../types'

export const customerQueryKeys = {
  all: ['customers'] as const,

  lists: () => [...customerQueryKeys.all, 'list'] as const,

  list: (filters?: { distinct?: boolean }) =>
    [
      ...customerQueryKeys.lists(),
      { distinct: filters?.distinct ?? false },
    ] as const,

  paginatedLists: () => [...customerQueryKeys.all, 'paginated'] as const,

  paginatedList: (s: CustomersSearch) =>
    [
      ...customerQueryKeys.paginatedLists(),
      normalizeCustomersSearch(s),
    ] as const,

  details: () => [...customerQueryKeys.all, 'detail'] as const,

  detail: (id: number) => [...customerQueryKeys.details(), id] as const,
}

export const customersListQuery = (filters?: CustomerListFilters) =>
  queryOptions({
    queryKey: customerQueryKeys.list(filters),
    queryFn: filters?.distinct ? getDistinctCustomers : getAllCustomers,
    staleTime: 1000 * 60 * 10,
  })

export function useFetchCustomers(filters?: CustomerListFilters) {
  return useQuery(customersListQuery(filters))
}

export const customersPaginatedQuery = (search: CustomersSearch) =>
  queryOptions({
    queryKey: customerQueryKeys.paginatedList(search),
    queryFn: () => getPaginatedCustomers({ data: search }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  })

export function useCustomersPaginated(search: CustomersSearch) {
  return useQuery(customersPaginatedQuery(search))
}

export const customerQuery = (id: number) =>
  queryOptions({
    queryKey: customerQueryKeys.detail(id),
    queryFn: () => getCustomerById({ data: { id } }),
  })
