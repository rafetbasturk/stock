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
  const { customerId, year } = filters;

  const yearOptions = [
    { id: "all", label: "Tümü", value: "" },
    ...years.map((y) => ({
      id: String(y),
      label: String(y),
      value: String(y),
    })),
  ];

  const handleClear = () =>
    onSearchChange({ customerId: undefined, year: undefined });

  return (
    <Card>
      <CardContent>
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
            placeholder="Tüm yıllar"
          />

          <Button
            variant="outline"
            onClick={handleClear}
            className="w-full md:w-48 border-muted bg-background hover:bg-accent font-normal text-muted-foreground"
          >
            Temizle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
