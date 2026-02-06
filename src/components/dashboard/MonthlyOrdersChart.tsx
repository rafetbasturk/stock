import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from 'recharts'
import { ErrorMessage } from '../error/ErrorMessage'
import { Skeleton } from '../ui/skeleton'
import { useSearch } from '@tanstack/react-router'
import { useFetchMonthlyOrders } from '@/lib/queries/metrics'
import { LoadingSpinner } from '../LoadingSpinner'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'
import { convertToCurrencyFormat } from '@/lib/currency'
import { useMounted } from '@/hooks/useMounted'

export default function MonthlyOrdersChart() {
  const mounted = useMounted()
  const search = useSearch({ from: '/' })
  const rates = useExchangeRatesStore((s) => s.rates)
  const preferredCurrency = useExchangeRatesStore((s) => s.preferredCurrency)

  const {
    data = [],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useFetchMonthlyOrders(search, rates, preferredCurrency)

  if (isLoading) {
    return <Skeleton className="h-62.5 rounded-xl" />
  }

  if (error) {
    return (
      <ErrorMessage
        title="Aylık siparişler yüklenirken hata oluştu"
        message={error?.message || 'Aylık sipariş durumu bulunamadı.'}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="relative h-62.5">
      {isFetching && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <LoadingSpinner variant="overlay" size="lg" />
        </div>
      )}

      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis
              dataKey="month"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'Sipariş',
                angle: -90,
                position: 'insideLeft',
                fontSize: 10,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                convertToCurrencyFormat({
                  cents: value,
                  currency: preferredCurrency,
                  compact: true,
                })
              }
              label={{
                value: 'Tutar',
                angle: 90,
                position: 'insideRight',
                fontSize: 10,
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border border-border p-2 rounded-md shadow-sm text-sm">
                      <p className="font-medium mb-1">{label}</p>
                      <div className="space-y-1">
                        <p className="text-primary flex justify-between gap-4">
                          <span>Sipariş Sayısı:</span>
                          <span className="font-semibold">
                            {payload[0].value}
                          </span>
                        </p>
                        <p className="text-green-600 flex justify-between gap-4">
                          <span>Toplam Tutar:</span>
                          <span className="font-semibold text-right">
                            {convertToCurrencyFormat({
                              cents: payload[1].value as number,
                              currency: preferredCurrency,
                            })}
                          </span>
                        </p>
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
              name="Sipariş Sayısı"
              fill="#0ea5e9"
              radius={[2, 2, 0, 0]}
              barSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              name="Toplam Tutar"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4, fill: '#22c55e' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  )
}
