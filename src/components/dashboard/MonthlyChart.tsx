import {
  Bar,
  ComposedChart,
  Legend,
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
import type { HomeSearch } from '@/lib/types'
import { useFetchMonthlyOverview } from '@/lib/queries/metrics'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'
import { convertToCurrencyFormat } from '@/lib/currency'
import { useMounted } from '@/hooks/useMounted'

interface Props {
  filters: HomeSearch
}

export default function MonthlyChart({ filters }: Props) {
  const { t } = useTranslation('dashboard')
  const mounted = useMounted()
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

  if (isLoading) {
    return <Skeleton className="h-100 rounded-xl" />
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
    <div className="relative h-100">
      {isFetching && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <LoadingSpinner variant="overlay" size="lg" />
        </div>
      )}

      {mounted ? (
        chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              {/* ... chart components ... */}
              <XAxis dataKey="monthName" fontSize={12} />
              <YAxis
                yAxisId="left"
                fontSize={12}
                label={{
                  value: t('monthly_orders.orders_axis'),
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 10,
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                fontSize={12}
                tickFormatter={(value) =>
                  convertToCurrencyFormat({
                    cents: value,
                    currency: preferredCurrency,
                    compact: true,
                    style: 'decimal',
                  })
                }
                label={{
                  value: t('monthly_orders.amount_axis', {
                    currency: `(${preferredCurrency})`,
                  }),
                  angle: 90,
                  position: 'insideRight',
                  fontSize: 10,
                }}
              />
              <Tooltip
                content={({ active, payload = [] }) => {
                  if (active && payload.length && payload[0]?.payload) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border border-border p-3 rounded-md shadow-lg text-sm min-w-50">
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
                                  payload.find((p) => p.dataKey === 'orders')
                                    ?.value
                                }
                              </span>
                            </p>
                            <p className="text-orange-500 flex justify-between gap-4">
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
                            <p className="text-green-600 flex justify-between gap-4">
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
                            <p className="text-purple-600 flex justify-between gap-4">
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
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar
                yAxisId="left"
                dataKey="orders"
                name={t('monthly_orders.orders_count')}
                fill="#0ea5e9"
                radius={[2, 2, 0, 0]}
                barSize={30}
              />
              <Bar
                yAxisId="left"
                dataKey="deliveries"
                name={t('monthly_orders.deliveries_count')}
                fill="#f97316"
                radius={[2, 2, 0, 0]}
                barSize={30}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                name={t('monthly_orders.total_amount')}
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3, fill: '#22c55e' }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="deliveredRevenue"
                name={t('monthly_orders.delivered_amount')}
                stroke="#9333ea"
                strokeWidth={2}
                dot={{ r: 3, fill: '#9333ea' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
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
