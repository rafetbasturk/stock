// src/lib/queries/metrics.ts
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { HomeSearch } from '../types/types.search'
import type { Currency } from '@/types'
import type { Rate } from '../currency'
import { getKeyMetrics, getMonthlyOverview } from '@/server/metrics'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'
import { AppError, BaseAppError } from '@/lib/error/core'

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

    queryFn: async () => {
      try {
        return await getKeyMetrics({
          data: {
            rates,
            filters: {
              customerId: filters.customerId,
              year: filters.year,
            },
            preferredCurrency,
          },
        })
      } catch (error) {
        const appError = AppError.from(error)
        if (appError.code === 'UNKNOWN_ERROR') {
          throw BaseAppError.create({ code: 'METRICS_FETCH_FAILED' })
        }
        throw appError
      }
    },

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

    queryFn: async () => {
      try {
        return await getMonthlyOverview({
          data: {
            filters,
            rates,
            preferredCurrency,
          },
        })
      } catch (error) {
        const appError = AppError.from(error)
        if (appError.code === 'UNKNOWN_ERROR') {
          throw BaseAppError.create({ code: 'OVERVIEW_FETCH_FAILED' })
        }
        throw appError
      }
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    meta: {
      feature: 'dashboard',
      silentOnBackground: true,
    },
  })
}
