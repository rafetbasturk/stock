// src/components/dashboard/Keymetrics.tsx
import type { HomeSearch } from '@/lib/types/types.search'
import { useFetchMetrics } from '@/lib/queries/metrics'
import { convertToCurrencyFormat } from '@/lib/currency'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'

import { Skeleton } from '../ui/skeleton'
import DashboardCard from './DashboardCard'
import { ErrorMessage } from '../error/ErrorMessage'

interface Props {
  filters: HomeSearch
}

export default function KeyMetrics({ filters }: Props) {
  const rates = useExchangeRatesStore((s) => s.rates)
  const preferredCurrency = useExchangeRatesStore((s) => s.preferredCurrency)

  const { data, isLoading, isError, error, refetch } = useFetchMetrics(
    filters,
    rates,
    preferredCurrency,
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-31.25 rounded-xl" />
          <Skeleton className="h-31.25 rounded-xl" />
          <Skeleton className="h-31.25 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-31.25 rounded-xl" />
          <Skeleton className="h-31.25 rounded-xl" />
          <Skeleton className="h-31.25 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Veriler yüklenirken hata oluştu"
        message={error?.message || 'Veriler alınamadı.'}
        onRetry={refetch}
      />
    )
  }

  if (!data) return null // Empty state

  const deliveredRevenue = convertToCurrencyFormat({
    cents: data.deliveredRevenue,
    currency: preferredCurrency,
  })

  const totalRevenue = convertToCurrencyFormat({
    cents: data.totalRevenue,
    currency: preferredCurrency,
  })

  const openRevenue = convertToCurrencyFormat({
    cents: data.totalRevenue - data.deliveredRevenue,
    currency: preferredCurrency,
  })

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Toplam Sipariş Tutarı" value={totalRevenue} />
        <DashboardCard
          title="Teslim Edilen Sipariş Tutarı"
          value={deliveredRevenue}
        />
        <DashboardCard title="Açık Sipariş Tutarı" value={openRevenue} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Toplam Sipariş Sayısı" value={data.totalOrders} />
        <DashboardCard
          title="Sipariş Sayısı (Bu Ay)"
          value={data.ordersThisMonth}
        />
        <DashboardCard title="Açık Sipariş Sayısı" value={data.pendingOrders} />
      </div>
    </>
  )
}
