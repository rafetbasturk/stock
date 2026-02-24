import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { ErrorMessage } from '../error/ErrorMessage'
import { Skeleton } from '../ui/skeleton'
import { LoadingSpinner } from '../LoadingSpinner'
import { useFetchMonthlyOverview } from '@/lib/queries/metrics'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'
import { convertToCurrencyFormat } from '@/lib/currency'
import { useMounted } from '@/hooks/useMounted'
import { useIsMobile } from '@/hooks/use-mobile'
import { HomeSearch } from '@/lib/types/types.search'

interface Props {
  filters: HomeSearch
}

export default function MonthlyChart({ filters }: Props) {
  const { t } = useTranslation('dashboard')
  const mounted = useMounted()
  const isMobile = useIsMobile()
  const rates = useExchangeRatesStore((s) => s.rates)
  const preferredCurrency = useExchangeRatesStore((s) => s.preferredCurrency)

  const {
    data: monthlyData = [],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useFetchMonthlyOverview(filters, rates, preferredCurrency)

  const shortMonths = t('months.short', {
    returnObjects: true,
  }) as Array<string>
  const longMonths = t('months.long', { returnObjects: true }) as Array<string>

  const chartData = useMemo(() => {
    if (!monthlyData.length) return []

    return monthlyData.map((month) => {
      return {
        ...month,
        monthName: shortMonths[month.monthIndex],
        fullMonthName: longMonths[month.monthIndex],
      }
    })
  }, [monthlyData, shortMonths, longMonths])

  const leftBarSize = isMobile ? 12 : 30
  const summary = useMemo(() => {
    if (!chartData.length) {
      return {
        orders: 0,
        deliveries: 0,
        revenue: 0,
        deliveredRevenue: 0,
      }
    }

    return chartData.reduce(
      (acc, item) => {
        acc.orders += Number(item.orders ?? 0)
        acc.deliveries += Number(item.deliveries ?? 0)
        acc.revenue += Number(item.revenue ?? 0)
        acc.deliveredRevenue += Number(item.deliveredRevenue ?? 0)
        return acc
      },
      {
        orders: 0,
        deliveries: 0,
        revenue: 0,
        deliveredRevenue: 0,
      },
    )
  }, [chartData])

  if (isLoading) {
    return <Skeleton className="h-80 md:h-100 rounded-xl" />
  }

  if (error) {
    return (
      <ErrorMessage
        title={t('monthly_orders.load_error_title')}
        message={error.message || t('monthly_orders.load_error_message')}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="relative w-full">
      {isFetching && (
        <div className="absolute top-2 right-2 z-10">
          <LoadingSpinner variant="overlay" size="sm" />
        </div>
      )}

      {mounted ? (
        chartData.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <div className="rounded-lg border bg-muted/20 p-2 md:p-3">
                <p className="text-[11px] md:text-xs text-primary/80 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-chart-1" />
                  {t('monthly_orders.orders_count')}
                </p>
                <p className="text-sm md:text-base font-semibold text-primary">
                  {summary.orders}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-2 md:p-3">
                <p className="text-[11px] md:text-xs text-chart-4/80 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-chart-4" />
                  {t('monthly_orders.deliveries_count')}
                </p>
                <p className="text-sm md:text-base font-semibold text-chart-4">
                  {summary.deliveries}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-2 md:p-3">
                <p className="text-[11px] md:text-xs text-chart-2/80 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-chart-2" />
                  {t('monthly_orders.total_amount')}
                </p>
                <p className="text-sm md:text-base font-semibold text-chart-2">
                  {convertToCurrencyFormat({
                    cents: summary.revenue,
                    currency: preferredCurrency,
                    compact: isMobile,
                  })}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-2 md:p-3">
                <p className="text-[11px] md:text-xs text-chart-5/80 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-chart-5" />
                  {t('monthly_orders.delivered_amount')}
                </p>
                <p className="text-sm md:text-base font-semibold text-chart-5">
                  {convertToCurrencyFormat({
                    cents: summary.deliveredRevenue,
                    currency: preferredCurrency,
                    compact: isMobile,
                  })}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 320}>
                <ComposedChart data={chartData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="monthName"
                    fontSize={isMobile ? 9 : 12}
                    tickMargin={8}
                    minTickGap={isMobile ? 20 : 8}
                  />
                  <YAxis
                    yAxisId="left"
                    fontSize={isMobile ? 9 : 12}
                    width={isMobile ? 20 : 40}
                    allowDecimals={false}
                    label={
                      isMobile
                        ? undefined
                        : {
                            value: t('monthly_orders.orders_axis'),
                            angle: -90,
                            position: 'insideLeft',
                            fontSize: 10,
                          }
                    }
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={isMobile ? 9 : 12}
                    width={isMobile ? 32 : 72}
                    tickFormatter={(value) =>
                      convertToCurrencyFormat({
                        cents: value,
                        currency: preferredCurrency,
                        compact: true,
                        style: 'decimal',
                      })
                    }
                    label={
                      isMobile
                        ? undefined
                        : {
                            value: t('monthly_orders.amount_axis', {
                              currency: `(${preferredCurrency})`,
                            }),
                            angle: 90,
                            position: 'insideRight',
                            fontSize: 10,
                          }
                    }
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
                    content={({ active, payload = [] }) => {
                      if (active && payload.length && payload[0]?.payload) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border border-border p-3 rounded-md shadow-lg text-xs md:text-sm min-w-44 md:min-w-50">
                            <p className="font-bold mb-2 border-b pb-1">
                              {data.fullMonthName}
                            </p>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <p className="text-primary flex justify-between gap-4">
                                  <span>
                                    {t('monthly_orders.orders_count_label')}
                                  </span>
                                  <span className="font-semibold">
                                    {
                                      payload.find(
                                        (p) => p.dataKey === 'orders',
                                      )?.value
                                    }
                                  </span>
                                </p>
                                <p className="text-chart-4 flex justify-between gap-4">
                                  <span>
                                    {t('monthly_orders.deliveries_count_label')}
                                  </span>
                                  <span className="font-semibold text-right">
                                    {
                                      payload.find(
                                        (p) => p.dataKey === 'deliveries',
                                      )?.value
                                    }
                                  </span>
                                </p>
                              </div>
                              <div className="pt-1 border-t space-y-1">
                                <p className="text-chart-2 flex justify-between gap-4">
                                  <span>
                                    {t('monthly_orders.total_amount_label')}
                                  </span>
                                  <span className="font-semibold text-right text-xs">
                                    {convertToCurrencyFormat({
                                      cents: payload.find(
                                        (p) => p.dataKey === 'revenue',
                                      )?.value as number,
                                      currency: preferredCurrency,
                                    })}
                                  </span>
                                </p>
                                <p className="text-chart-5 flex justify-between gap-4">
                                  <span>
                                    {t('monthly_orders.delivered_amount_label')}
                                  </span>
                                  <span className="font-semibold text-right text-xs">
                                    {convertToCurrencyFormat({
                                      cents: payload.find(
                                        (p) => p.dataKey === 'deliveredRevenue',
                                      )?.value as number,
                                      currency: preferredCurrency,
                                    })}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="orders"
                    name={t('monthly_orders.orders_count')}
                    fill="var(--chart-1)"
                    radius={[2, 2, 0, 0]}
                    barSize={leftBarSize}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="deliveries"
                    name={t('monthly_orders.deliveries_count')}
                    fill="var(--chart-4)"
                    radius={[2, 2, 0, 0]}
                    barSize={leftBarSize}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name={t('monthly_orders.total_amount')}
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={isMobile ? false : { r: 3, fill: 'var(--chart-2)' }}
                    activeDot={{ r: isMobile ? 4 : 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="deliveredRevenue"
                    name={t('monthly_orders.delivered_amount')}
                    stroke="var(--chart-5)"
                    strokeWidth={2}
                    dot={isMobile ? false : { r: 3, fill: 'var(--chart-5)' }}
                    activeDot={{ r: isMobile ? 4 : 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <p>{t('monthly_orders.no_data')}</p>
          </div>
        )
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  )
}
