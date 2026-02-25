// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { LucideLayoutDashboard } from 'lucide-react'
import { zodValidator } from '@tanstack/zod-adapter'
import type { HomeSearch } from '@/lib/types/types.search'
import { homeSearchSchema } from '@/lib/types/types.search'
import { generateYearOptions } from '@/lib/utils'
import { yearRangeQuery } from '@/lib/queries/orders'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DashboardFilters,
  KeyMetrics,
  MonthlyChart,
  StockIntegrityAlert,
} from '@/components/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/')({
  validateSearch: zodValidator(homeSearchSchema),
  loader: async ({ context }) => {
    const years = await context.queryClient.ensureQueryData(yearRangeQuery)
    return generateYearOptions(years.minYear, years.maxYear)
  },
  component: Dashboard,
  pendingComponent: DashboardPending,
  staticData: {
    sidebar: {
      label: 'nav.dashboard',
      icon: LucideLayoutDashboard,
      order: 10,
    },
  },
})

function Dashboard() {
  const { t } = useTranslation('dashboard')
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const years = Route.useLoaderData()

  const handleSearchChange = (updates: Partial<HomeSearch>) => {
    navigate({
      to: '/',
      search: { ...search, ...updates },
      replace: true,
    })
  }

  return (
    <div className="px-2 pt-0 pb-8 md:p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between gap-6">
        <h1 className="text-3xl font-bold tracking-tight capitalize my-auto">
          {t('heading')}
        </h1>

        <DashboardFilters
          years={years}
          filters={search}
          onSearchChange={handleSearchChange}
        />
      </div>

      <StockIntegrityAlert />

      <div className="space-y-4">
        <KeyMetrics filters={search} />

        <Card className="shadow-sm border-primary/5 gap-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {t('sections.monthly_chart')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <MonthlyChart filters={search} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardPending() {
  return (
    <div className="px-2 pt-0 pb-8 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-6">
        <Skeleton className="h-9 w-48 md:w-72" />
        <div className="hidden md:flex items-center gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="md:hidden">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <Skeleton className="h-16 w-full rounded-lg" />

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-49.5 rounded-xl" />
          <Skeleton className="h-49.5 rounded-xl" />
          <Skeleton className="h-49.5 rounded-xl" />
        </div>

        <Card className="shadow-sm border-primary/5 gap-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              <Skeleton className="h-5 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <Skeleton className="h-80 md:h-100 rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
