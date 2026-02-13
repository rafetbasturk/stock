import { useTranslation } from 'react-i18next'
import { Skeleton } from '../ui/skeleton'
import { ErrorMessage } from '../error/ErrorMessage'
import DashboardCard from './DashboardCard'
import type { HomeSearch } from '@/lib/types/types.search'
import { useFetchMetrics } from '@/lib/queries/metrics'
import { convertToCurrencyFormat } from '@/lib/currency'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'
import { Clock, PackageCheck, Wallet } from 'lucide-react'

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-49.5 rounded-xl" />
        <Skeleton className="h-49.5 rounded-xl" />
        <Skeleton className="h-49.5 rounded-xl" />
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard
        title={t('metrics.total_order_amount')}
        value={totalRevenue}
        icon={Wallet}
        description={t('metrics.total_desc')}
      />
      <DashboardCard
        title={t('metrics.delivered_order_amount')}
        value={deliveredRevenue}
        icon={PackageCheck}
        status="success"
        description={t('metrics.delivered_desc')}
      />
      <DashboardCard
        title={t('metrics.open_order_amount')}
        value={openRevenue}
        icon={Clock}
        status="warning"
        description={t('metrics.open_desc')}
      />
    </div>
  )
}
