// src/lib/queries/metrics.ts
import { useQuery } from '@tanstack/react-query'
import type { HomeSearch } from '../types/types.search'
import type { Currency } from '@/types'
import type { Rate } from '../currency'
import { getKeyMetrics, getMonthlyOverview } from '@/server/metrics'

export const useFetchMetrics = (
  filters: HomeSearch,
  rates: Array<Rate>,
  preferredCurrency: Currency,
) => {
  const isReady = rates.length > 0 && !!preferredCurrency

  return useQuery({
    queryKey: [
      'metrics',
      filters.customerId ?? null,
      filters.year ?? null,
      preferredCurrency ?? null,
      rates,
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

export const useFetchMonthlyOverview = (
  filters: HomeSearch,
  rates: Array<Rate>,
  preferredCurrency: Currency,
) => {
  return useQuery({
    queryKey: [
      'monthly-overview',
      filters.customerId ?? null,
      filters.year ?? null,
      preferredCurrency ?? null,
      rates,
    ],
    queryFn: () =>
      getMonthlyOverview({
        data: {
          filters,
          rates,
          preferredCurrency,
        },
      }),
  })
}
