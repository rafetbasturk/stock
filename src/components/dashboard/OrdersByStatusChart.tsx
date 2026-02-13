import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import { ErrorMessage } from '../error/ErrorMessage'
import { Skeleton } from '../ui/skeleton'
import { LoadingSpinner } from '../LoadingSpinner'
import type { HomeSearch } from '@/lib/types/types.search'
import { useFetchOrdersByStatus } from '@/lib/queries/metrics'
import { useMounted } from '@/hooks/useMounted'
import type { PieSectorShapeProps } from 'recharts/types/polar/Pie'
import { useState, useMemo } from 'react'

export type OrderStatus = {
  name: string
  value: number
}

interface Props {
  search: HomeSearch
}

const STATUS_COLORS: Record<string, string> = {
  KAYIT: '#292524',
  ÜRETİM: '#9A3412',
  HAZIR: '#3730A3',
  BİTTİ: '#065F46',
  İPTAL: '#e2e8f0',
}

interface Props {
  search: HomeSearch
}

type ChartPayload = {
  name: string
  value: number
  fill: string
  isActive?: boolean
}

type ActiveShapeProps = PieSectorShapeProps & {
  payload?: ChartPayload
}

function ActiveShape(props: ActiveShapeProps) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
  } = props

  const isActive = payload?.isActive === true

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={isActive ? outerRadius + 6 : outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={6}
    />
  )
}

function CustomTooltip({
  active,
  payload,
  orderSuffix,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
  orderSuffix: string
}) {
  if (!active || !payload?.length) return null

  const { name, value } = payload[0]

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md text-center">
      <span className="font-medium capitalize">{name}</span>
      <div className="mt-1 text-muted-foreground">
        {value} {orderSuffix}
      </div>
    </div>
  )
}

//
// Center label
//
function CenterLabel({ total, label }: { total: number; label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-2xl font-semibold tabular-nums">{total}</span>

      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

//
// Main component
//
export default function OrdersByStatusChart({ search }: Props) {
  const { t } = useTranslation('dashboard')

  const mounted = useMounted()

  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const {
    data = [],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useFetchOrdersByStatus(search)

  //
  // total
  //
  const total = useMemo(
    () => data.reduce((acc, item) => acc + item.value, 0),
    [data],
  )

  //
  // chart data with fill + active state
  //
  const chartData = useMemo(
    () =>
      data.map((entry, index) => ({
        ...entry,
        fill: STATUS_COLORS[entry.name],
        isActive: index === activeIndex,
      })),
    [data, activeIndex],
  )

  //
  // loading
  //
  if (isLoading) return <Skeleton className="h-62.5 rounded-xl" />

  //
  // error
  //
  if (error)
    return (
      <ErrorMessage
        title={t('status_chart.load_error_title')}
        message={error.message || t('status_chart.load_error_message')}
        onRetry={refetch}
      />
    )

  //
  // empty
  //
  if (!data.length)
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border text-sm text-muted-foreground">
        {t('status_chart.no_data')}
      </div>
    )

  //
  // render
  //
  return (
    <div className="relative h-80">
      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-xl">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {mounted ? (
        <>
          <CenterLabel total={total} label={t('status_chart.total_orders')} />

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                cornerRadius={6}
                shape={ActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={300}
                label
              />

              <Tooltip
                cursor={false}
                content={
                  <CustomTooltip orderSuffix={t('status_chart.order_suffix')} />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </>
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  )
}
