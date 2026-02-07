// src/components/dashboard/Keymetrics.tsx
import { useTranslation } from 'react-i18next'
import { Skeleton } from '../ui/skeleton'
import { ErrorMessage } from '../error/ErrorMessage'
import DashboardCard from './DashboardCard'
import type { HomeSearch } from '@/lib/types/types.search'
import { useFetchMetrics } from '@/lib/queries/metrics'
import { convertToCurrencyFormat } from '@/lib/currency'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'


interface Props {
  filters: HomeSearch
}

export default function KeyMetrics({ filters }: Props) {
  const { t } = useTranslation('dashboard')
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
        title={t('metrics.load_error_title')}
        message={error.message || t('metrics.load_error_message')}
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
        <DashboardCard title={t('metrics.total_order_amount')} value={totalRevenue} />
        <DashboardCard
          title={t('metrics.delivered_order_amount')}
          value={deliveredRevenue}
        />
        <DashboardCard title={t('metrics.open_order_amount')} value={openRevenue} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title={t('metrics.total_order_count')} value={data.totalOrders} />
        <DashboardCard
          title={t('metrics.order_count_this_month')}
          value={data.ordersThisMonth}
        />
        <DashboardCard title={t('metrics.open_order_count')} value={data.pendingOrders} />
      </div>
    </>
  )
}
