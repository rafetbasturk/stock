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
import { useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ErrorMessage } from '../error/ErrorMessage'
import { Skeleton } from '../ui/skeleton'
import { LoadingSpinner } from '../LoadingSpinner'
import {
  useFetchMonthlyDeliveries,
  useFetchMonthlyOrders,
} from '@/lib/queries/metrics'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'
import { convertToCurrencyFormat } from '@/lib/currency'
import { useMounted } from '@/hooks/useMounted'
import { useMemo } from 'react'

export default function MonthlyOrdersChart() {
  const { t } = useTranslation('dashboard')
  const mounted = useMounted()
  const search = useSearch({ from: '/' })
  const rates = useExchangeRatesStore((s) => s.rates)
  const preferredCurrency = useExchangeRatesStore((s) => s.preferredCurrency)

  const {
    data: ordersData = [],
    isLoading: isOrdersLoading,
    error: ordersError,
    isFetching: isOrdersFetching,
    refetch: refetchOrders,
  } = useFetchMonthlyOrders(search, rates, preferredCurrency)

  const {
    data: deliveriesData = [],
    isLoading: isDeliveriesLoading,
    error: deliveriesError,
    isFetching: isDeliveriesFetching,
    refetch: refetchDeliveries,
  } = useFetchMonthlyDeliveries(search, rates, preferredCurrency)

  const shortMonths = t('months.short', { returnObjects: true }) as string[]
  const longMonths = t('months.long', { returnObjects: true }) as string[]

  const chartData = useMemo(() => {
    if (!ordersData.length && !deliveriesData.length) return []

    // Merge by month index
    return ordersData.map((orderMonth) => {
      const deliveryMonth = deliveriesData.find(
        (d) => d.monthIndex === orderMonth.monthIndex,
      )
      return {
        ...orderMonth,
        deliveries: deliveryMonth?.deliveries ?? 0,
        deliveredRevenue: deliveryMonth?.revenue ?? 0,
        monthName: shortMonths[orderMonth.monthIndex],
        fullMonthName: longMonths[orderMonth.monthIndex],
      }
    })
  }, [ordersData, deliveriesData, shortMonths, longMonths])

  const isLoading = isOrdersLoading || isDeliveriesLoading
  const isFetching = isOrdersFetching || isDeliveriesFetching
  const error = ordersError || deliveriesError

  if (isLoading) {
    return <Skeleton className="h-80 rounded-xl" />
  }

  if (error) {
    return (
      <ErrorMessage
        title={t('monthly_orders.load_error_title')}
        message={error.message || t('monthly_orders.load_error_message')}
        onRetry={() => {
          refetchOrders()
          refetchDeliveries()
        }}
      />
    )
  }

  return (
    <div className="relative h-80">
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
                barSize={15}
              />
              <Bar
                yAxisId="left"
                dataKey="deliveries"
                name={t('monthly_orders.deliveries_count')}
                fill="#f97316"
                radius={[2, 2, 0, 0]}
                barSize={15}
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
