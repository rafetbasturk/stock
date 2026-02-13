import { useTranslation } from "react-i18next";
import { Card, CardContent } from "../ui/card";
import CustomerInput from "../form/CustomerInput";
import EntitySelect from "../form/EntitySelect";
import type { HomeSearch } from "@/lib/types/types.search";
import { Button } from "@/components/ui/button";

interface Props {
  years: Array<string>;
  filters: HomeSearch;
  onSearchChange: (updates: Partial<HomeSearch>) => void;
}

export default function DashboardFilters({
  years = [],
  filters,
  onSearchChange,
}: Props) {
  const { t } = useTranslation("dashboard");
  const { customerId, year } = filters;

  const yearOptions = [
    { id: "all", label: t("filters.all"), value: "" },
    ...years.map((y) => ({
      id: String(y),
      label: String(y),
      value: String(y),
    })),
  ];

  const handleClear = () =>
    onSearchChange({ customerId: undefined, year: undefined });

  return (
    <Card className="p-0 border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <CustomerInput
            value={customerId ?? null}
            onValueChange={(id) =>
              onSearchChange({ customerId: id ?? undefined })
            }
            includeAllOption
          />

          <EntitySelect
            value={year ? String(year) : ""}
            onValueChange={(val) => {
              if (!val || val === "all") {
                onSearchChange({ year: undefined });
                return;
              }

              const numericYear = typeof val === "number" ? val : Number(val);

              if (Number.isNaN(numericYear)) {
                onSearchChange({ year: undefined });
              } else {
                onSearchChange({ year: numericYear });
              }
            }}
            options={yearOptions}
            placeholder={t("filters.all_years")}
          />

          <Button
            variant="outline"
            onClick={handleClear}
            className="w-full md:w-48 border-muted bg-background hover:bg-accent font-normal text-muted-foreground"
          >
            {t("filters.clear")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
