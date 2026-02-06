// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

import type { HomeSearch } from "@/lib/types/types.search";
import { generateYearOptions } from "@/lib/utils";
import { yearRangeQuery } from "@/lib/queries/orders";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DashboardFilters,
  KeyMetrics,
  MonthlyOrdersChart,
  OrdersByStatusChart,
} from "@/components/dashboard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LucideLayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const result: HomeSearch = {};

    if (search.customerId != null && search.customerId !== "") {
      const customerId = Number(search.customerId);
      if (!Number.isNaN(customerId)) {
        result.customerId = customerId;
      }
    }

    if (search.year != null && search.year !== "") {
      const year = Number(search.year);
      if (!Number.isNaN(year)) {
        result.year = year;
      }
    }

    return result;
  },
  loader: async ({ context }) => {
    const years = await context.queryClient.ensureQueryData(yearRangeQuery);
    return generateYearOptions(years.minYear, years.maxYear);
  },
  component: Dashboard,
  pendingComponent: () => <LoadingSpinner variant="full-page" text="/index" />,
  staticData: {
    sidebar: {
      label: "Panel",
      icon: LucideLayoutDashboard,
      order: 10,
    },
  },
});

function Dashboard() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const years = Route.useLoaderData();

  const handleSearchChange = (updates: Partial<HomeSearch>) => {
    navigate({
      to: "/",
      search: { ...search, ...updates },
      replace: true,
    });
  };

  return (
    <div className="p-2 md:p-6 space-y-6">
      <DashboardFilters
        years={years}
        onSearchChange={handleSearchChange}
        filters={search}
      />

      <KeyMetrics filters={search} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sipariş Durumları</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersByStatusChart search={search} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aylık Sipariş Sayıları</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyOrdersChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
