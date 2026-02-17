// src/lib/queries/metrics.ts
import { useQuery } from '@tanstack/react-query'
import type { HomeSearch } from '../types/types.search'
import type { Currency } from '@/types'
import type { Rate } from '../currency'
import { getKeyMetrics, getMonthlyOverview } from '@/server/metrics'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'

export const metricsQueryKeys = {
  all: ['metrics'] as const,

  keyMetrics: (
    filters: HomeSearch,
    preferredCurrency: Currency,
    ratesUpdatedAt: number | null,
  ) =>
    [
      ...metricsQueryKeys.all,
      'keyMetrics',
      {
        customerId: filters.customerId ?? null,
        year: filters.year ?? null,
        currency: preferredCurrency,
        ratesUpdatedAt,
      },
    ] as const,

  monthlyOverview: (
    filters: HomeSearch,
    preferredCurrency: Currency,
    ratesUpdatedAt: number | null,
  ) =>
    [
      ...metricsQueryKeys.all,
      'monthlyOverview',
      {
        customerId: filters.customerId ?? null,
        year: filters.year ?? null,
        currency: preferredCurrency,
        ratesUpdatedAt,
      },
    ] as const,
}

export const useFetchMetrics = (
  filters: HomeSearch,
  rates: Rate[],
  preferredCurrency: Currency,
) => {
  const lastUpdated = useExchangeRatesStore((s) => s.lastUpdated)
  const isReady =
    !!preferredCurrency && lastUpdated !== null && rates.length > 0

  return useQuery({
    queryKey: metricsQueryKeys.keyMetrics(
      filters,
      preferredCurrency,
      lastUpdated,
    ),

    queryFn: () =>
      getKeyMetrics({
        data: {
          rates,
          filters: {
            customerId: filters.customerId,
            year: filters.year,
          },
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
  rates: Rate[],
  preferredCurrency: Currency,
) => {
  const lastUpdated = useExchangeRatesStore((s) => s.lastUpdated)

  return useQuery({
    queryKey: metricsQueryKeys.monthlyOverview(
      filters,
      preferredCurrency,
      lastUpdated,
    ),

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
