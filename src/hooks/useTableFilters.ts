// src/hooks/useTableFilters.ts
import { useMemo } from "react";
import type { Table } from "@tanstack/react-table";
import type { DataTableFilter } from "@/components/DataTable";

export type TableFilter = DataTableFilter;

type TableSearch = Record<string, string | undefined>;

interface UseTableFiltersProps<TData> {
  table: Table<TData>;
  filters?: TableFilter[];
  search?: TableSearch;
  globalFilter?: string;
}

export function useTableFilters<TData>({
  table,
  filters = [],
  search = {},
  globalFilter,
}: UseTableFiltersProps<TData>) {
  const columnFilters = table.getState().columnFilters;

  const handleSingleFilterChange = (columnId: string, value: string) => {
    table
      .getColumn(columnId)
      ?.setFilterValue(value === "all" || value === "" ? undefined : value);
  };

  const handleMultiFilterChange = (
    columnId: string,
    selectedValues: string[]
  ) => {
    table
      .getColumn(columnId)
      ?.setFilterValue(selectedValues.length ? selectedValues : undefined);
  };

  const activeFilters = useMemo(() => {
    const items: string[] = [];

    // q (global search)
    const q = globalFilter?.trim();
    if (q) items.push(`Ara: ${q}`);

    // daterange (URL-level)
    const start = search.startDate;
    const end = search.endDate;
    if (start || end) items.push(`Tarih: ${start ?? "…"} - ${end ?? "…"}`);

    for (const filter of filters) {
      if (filter.isVirtual) continue;

      // text filters are URL-level in your table
      if (filter.type === "text") {
        const v = search[filter.columnId];
        if (typeof v === "string" && v.trim()) {
          items.push(`${filter.label}: ${v.trim()}`);
        }
        continue;
      }

      // multi/select are table columnFilters
      const column = table.getColumn(filter.columnId);
      if (!column) continue;

      const value = column.getFilterValue();
      if (value == null) continue; // IMPORTANT: don't use `if (!value)` here

      if (filter.type === "multi" && Array.isArray(value) && value.length) {
        const labels = filter.options?.length
          ? value.map(
              (v) => filter.options!.find((o) => o.value === v)?.label ?? v
            )
          : value;

        items.push(`${filter.label}: ${labels.join(", ")}`);
        continue;
      }

      if (
        filter.type === "select" &&
        typeof value === "string" &&
        value !== ""
      ) {
        const label =
          filter.options?.find((o) => o.value === value)?.label ?? value;
        items.push(`${filter.label}: ${label}`);
        continue;
      }
    }

    return items;
  }, [filters, table, columnFilters, search, globalFilter]);

  const hasActiveFilters = activeFilters.length > 0;

  const clearAllFilters = () => {
    table.setColumnFilters([]);
  };

  const clearFilter = (columnId: string) => {
    table.getColumn(columnId)?.setFilterValue(undefined);
  };

  return {
    handleSingleFilterChange,
    handleMultiFilterChange,
    activeFilters,
    hasActiveFilters,
    clearAllFilters,
    clearFilter,
  };
}
