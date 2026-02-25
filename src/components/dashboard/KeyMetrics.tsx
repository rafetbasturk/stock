import { Clock, PackageCheck, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorMessage } from '../error/ErrorMessage'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import DashboardCard from './DashboardCard'
import type { HomeSearch } from '@/lib/types/types.search'
import { convertToCurrencyFormat } from '@/lib/currency'
import { useFetchMetrics } from '@/lib/queries/metrics'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'

interface Props {
  filters: HomeSearch
}

export default function KeyMetrics({ filters }: Props) {
  const { t } = useTranslation('dashboard')
  const rates = useExchangeRatesStore((s) => s.rates)
  const lastUpdated = useExchangeRatesStore((s) => s.lastUpdated)
  const preferredCurrency = useExchangeRatesStore((s) => s.preferredCurrency)
  const isReady =
    !!preferredCurrency && lastUpdated !== null && rates.length > 0

  const { data, isLoading, isFetching, isError, error, refetch } = useFetchMetrics(
    filters,
    rates,
    preferredCurrency,
  )
  const isInitialLoading = (!isReady || isLoading) && !data

  if (isInitialLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-49.5 rounded-xl" />
        <Skeleton className="h-49.5 rounded-xl" />
        <Skeleton className="h-49.5 rounded-xl" />
      </div>
    )
  }

  if (isError && !data) {
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
    <div className="relative">
      {isFetching && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-background/35" />
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DashboardCard
        title={t('metrics.total_order_amount')}
        value={totalRevenue}
        icon={Wallet}
        description={t('metrics.total_desc')}
        footerRight={
          <Badge variant="secondary" className="font-medium tracking-wide">
            {t('metrics.total_orders_chip', { count: data.totalOrders })}
          </Badge>
        }
      />
      <DashboardCard
        title={t('metrics.delivered_order_amount')}
        value={deliveredRevenue}
        icon={PackageCheck}
        status="success"
        description={t('metrics.delivered_desc')}
        footerRight={
          <Badge variant="secondary" className="font-medium tracking-wide">
            {t('metrics.completed_orders_chip', {
              count: data.totalOrders - data.pendingOrders,
            })}
          </Badge>
        }
      />
      <DashboardCard
        title={t('metrics.open_order_amount')}
        value={openRevenue}
        icon={Clock}
        status="warning"
        description={t('metrics.open_desc')}
        footerRight={
          <Badge variant="secondary" className="font-medium tracking-wide">
            {t('metrics.pending_orders_chip', { count: data.pendingOrders })}
          </Badge>
        }
      />
      </div>
    </div>
  )
}
