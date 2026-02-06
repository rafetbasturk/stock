// src/lib/queries/metrics.ts
import { useQuery } from '@tanstack/react-query'
import type { HomeSearch } from '../types/types.search'
import type { Currency } from '@/types'
import type { Rate } from '../currency'
import {
  getKeyMetrics,
  getMonthlyOrders,
  getOrdersByStatus,
} from '@/server/metrics'

export const useFetchMetrics = (
  filters: HomeSearch,
  rates: Rate[],
  preferredCurrency: Currency,
) => {
  const isReady = rates.length > 0 && !!preferredCurrency

  return useQuery({
    queryKey: [
      'metrics',
      filters.customerId ?? null,
      filters.year ?? null,
      preferredCurrency ?? null,
    ],
    queryFn: () =>
      getKeyMetrics({
        data: {
          rates,
          filters: { customerId: filters.customerId, year: filters.year },
          preferredCurrency,
        },
      }),
    enabled: isReady,
    staleTime: 60 * 1000,
    meta: {
      feature: 'dashboard',
      silentOnBackground: true,
    },
  })
}

export const useFetchOrdersByStatus = (filters: HomeSearch) => {
  return useQuery({
    queryKey: [
      'order-status',
      filters.customerId ?? null,
      filters.year ?? null,
    ],
    queryFn: () =>
      getOrdersByStatus({
        data: filters,
      }),
  })
}

export const useFetchMonthlyOrders = (
  filters: HomeSearch,
  rates: Rate[],
  preferredCurrency: Currency,
) => {
  return useQuery({
    queryKey: [
      'order-monthly',
      filters.customerId ?? null,
      filters.year ?? null,
      preferredCurrency ?? null,
    ],
    queryFn: () =>
      getMonthlyOrders({
        data: {
          filters,
          rates,
          preferredCurrency,
        },
      }),
  })
}
