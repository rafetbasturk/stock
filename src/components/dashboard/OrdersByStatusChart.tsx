import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts'
import { ErrorMessage } from '../error/ErrorMessage'
import { Skeleton } from '../ui/skeleton'
import { LoadingSpinner } from '../LoadingSpinner'
import { useFetchOrdersByStatus } from '@/lib/queries/metrics'
import type { HomeSearch } from '@/lib/types/types.search'
import { useMounted } from '@/hooks/useMounted'

export type OrderStatus = {
  name: string
  value: number
}

interface Props {
  search: HomeSearch
}

const STATUS_COLORS: Record<string, string> = {
  KAYIT: '#9F2D00',
  ÜRETİM: '#3729AB',
  HAZIR: '#22c55e',
  BİTTİ: '#0ea5e9',
  İPTAL: '#2A2524',
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const { name, value } = payload[0]

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md text-center">
      <span className="font-medium capitalize">{name}</span>
      <div className="mt-1 text-muted-foreground">{value} sipariş</div>
    </div>
  )
}

function CenterLabel({ total }: { total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-2xl font-semibold">{total}</span>
      <span className="text-xs text-muted-foreground">Toplam Sipariş</span>
    </div>
  )
}

export default function OrdersByStatusChart({ search }: Props) {
  const mounted = useMounted()

  const {
    data = [],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useFetchOrdersByStatus(search)

  const total = data.reduce((acc, item) => acc + item.value, 0)

  if (isLoading) {
    return <Skeleton className="h-62.5 rounded-xl" />
  }

  if (error) {
    return (
      <ErrorMessage
        title="Sipariş durumu yüklenirken hata oluştu"
        message={error?.message || 'Sipariş durumu bulunamadı.'}
        onRetry={refetch}
      />
    )
  }

  if (!data.length) {
    return (
      <div className="flex h-62.5 items-center justify-center rounded-xl border text-sm text-muted-foreground">
        Gösterilecek sipariş verisi yok
      </div>
    )
  }

  return (
    <div className="relative h-62.5">
      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-xl">
          <LoadingSpinner size="lg" />
        </div>
      )}
      {mounted ? (
        <>
          <CenterLabel total={total} />
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.map((entry: OrderStatus) => {
                  return {
                    ...entry,
                    fill: STATUS_COLORS[entry.name],
                  }
                })}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={8}
                dataKey="value"
                label
              ></Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </>
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  )
}
