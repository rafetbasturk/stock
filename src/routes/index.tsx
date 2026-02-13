// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { LucideLayoutDashboard } from 'lucide-react'
import type { HomeSearch } from '@/lib/types/types.search'
import { generateYearOptions } from '@/lib/utils'
import { yearRangeQuery } from '@/lib/queries/orders'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DashboardFilters,
  KeyMetrics,
  MonthlyOrdersChart,
  OrdersByStatusChart,
} from '@/components/dashboard'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const result: HomeSearch = {}

    if (search.customerId != null && search.customerId !== '') {
      const customerId = Number(search.customerId)
      if (!Number.isNaN(customerId)) {
        result.customerId = customerId
      }
    }

    if (search.year != null && search.year !== '') {
      const year = Number(search.year)
      if (!Number.isNaN(year)) {
        result.year = year
      }
    }

    return result
  },
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
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight capitalize my-auto">
          {t('heading')}
        </h1>

        <DashboardFilters
          years={years}
          filters={search}
          onSearchChange={handleSearchChange}
        />
      </div>

      <div className="space-y-8">
        <KeyMetrics filters={search} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-4 shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-base font-semibold">
                {t('sections.status_chart')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersByStatusChart search={search} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-8 shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-base font-semibold">
                {t('sections.monthly_chart')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyOrdersChart />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DashboardPending() {
  const { t } = useTranslation('dashboard')
  return <LoadingSpinner variant="full-page" text={t('pending')} />
}
