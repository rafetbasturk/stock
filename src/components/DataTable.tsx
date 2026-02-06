// src/components/DataTable.tsx
import { Fragment, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useTableFilters } from "@/hooks/useTableFilters";
import {
  encodeFiltersToParams,
  decodeParamsToFilters,
} from "@/lib/filtersUtility";

import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { DateRangeFilter } from "./DateRangeFilter";

export interface DataTableFilter {
  columnId: string;
  label: string;
  type: "select" | "multi" | "daterange" | "text";
  options?: { value: string; label: string }[];
  isVirtual?: boolean;
}

type TableSearch = Record<string, string | undefined>;

interface DataTableProps<TData, TValue> {
  data: TData[];
  total: number;
  serverPageIndex: number;
  serverPageSize: number;
  onServerPageChange: (p: number) => void;
  onServerPageSizeChange: (s: number) => void;
  getRowClassName?: (row: TData) => string;
  columns: ColumnDef<TData, TValue>[];
  customFilters?: DataTableFilter[];

  search?: TableSearch;
  onSearchChange?: (updates: TableSearch) => void;

  onRowClick?: (row: TData) => void;
  renderExpandedRow?: (row: TData) => React.ReactNode;

  enableAutofocus?: boolean;
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  showColumnVisibilityToggle?: boolean;
}

export default function DataTable<TData, TValue>({
  data,
  total,
  serverPageIndex,
  serverPageSize,
  onServerPageChange,
  onServerPageSizeChange,
  getRowClassName,
  columns,
  customFilters = [],
  search = {},
  onSearchChange = () => {},
  onRowClick,
  renderExpandedRow,
  enableAutofocus = false,
  initialSorting,
  initialColumnVisibility,
  showColumnVisibilityToggle = false,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState((search.q as string) ?? "");

  const [columnFilters, setColumnFilters] = useState(() =>
    decodeParamsToFilters(
      search,
      customFilters.filter((f) => !f.isVirtual),
    ),
  );

  const sortByFromUrl = search.sortBy;
  const sortDirFromUrl =
    (search.sortDir as "asc" | "desc" | undefined) ?? "asc";

  const [sorting, setSorting] = useState<SortingState>(() => {
    if (sortByFromUrl) {
      return [{ id: sortByFromUrl, desc: sortDirFromUrl === "desc" }];
    }
    return initialSorting ?? [];
  });

  useEffect(() => {
    if (sortByFromUrl) {
      setSorting([
        {
          id: sortByFromUrl,
          desc: sortDirFromUrl === "desc",
        },
      ]);
    } else if (initialSorting && initialSorting.length > 0) {
      setSorting(initialSorting);
    } else {
      setSorting([]);
    }
  }, [search.sortBy, search.sortDir, initialSorting]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    manualSorting: true,
    enableSortingRemoval: false,
    manualFiltering: true,
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const nextSorting =
          typeof updater === "function" ? updater(prev) : updater;

        const [s] = nextSorting;
        if (s) {
          onSearchChange({
            sortBy: s.id,
            sortDir: s.desc ? "desc" : "asc",
            pageIndex: "0",
          });
        }
        return nextSorting;
      });
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  // 🔥 Filter helpers (for multi/select)
  const {
    activeFilters,
    hasActiveFilters,
    clearAllFilters,
    handleMultiFilterChange,
    handleSingleFilterChange,
  } = useTableFilters({
    table,
    filters: customFilters,
    search,
    globalFilter,
  });

  // 🔁 Sync columnFilters & globalFilter → URL search params (for q + table filters only)
  useEffect(() => {
    const filterParams = encodeFiltersToParams(
      columnFilters,
      customFilters.filter((f) => !f.isVirtual),
    );

    const q = globalFilter.trim();
    const next: Record<string, string | undefined> = {
      ...search,
      q: q.length ? q : undefined, // keep key with undefined when empty
      ...filterParams,
    };

    // Compare using a compacted copy (but DO NOT send the compacted version)
    const compact = (obj: Record<string, string | undefined>) => {
      const copy: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) copy[k] = v;
      }
      return copy;
    };

    if (
      JSON.stringify(compact(search as any)) !== JSON.stringify(compact(next))
    ) {
      onSearchChange(next); // ✅ sends q: undefined when cleared
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, columnFilters, customFilters]);

  const safePageSize = Math.max(1, Number(serverPageSize) || 100);
  const safeTotal = Math.max(0, Number(total) || 0);
  const pageCount = Math.max(1, Math.ceil(safeTotal / safePageSize));

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 🔍 Search + Filters */}
      <div className="flex gap-4 justify-between">
        <div className="grow flex flex-col md:flex-row items-start md:items-center gap-2">
          <Input
            placeholder="Ara..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            autoFocus={enableAutofocus}
            className="w-full md:max-w-sm"
          />

          {customFilters.map((filter) => {
            const column = table.getColumn(filter.columnId);

            switch (filter.type) {
              case "daterange":
                return (
                  <DateRangeFilter
                    key={filter.columnId}
                    label={filter.label}
                    start={search.startDate}
                    end={search.endDate}
                    onChange={(updates) =>
                      onSearchChange({
                        pageIndex: "0",
                        ...updates,
                      })
                    }
                  />
                );

              case "multi":
                if (!column || !filter.options) return null;
                return (
                  <MultiSelectFilter
                    key={filter.columnId}
                    filter={{
                      columnId: filter.columnId,
                      label: filter.label,
                      options: filter.options,
                    }}
                    column={column}
                    onChange={(colId, values) => {
                      handleMultiFilterChange(colId, values);
                      onSearchChange({ pageIndex: "0" });
                    }}
                  />
                );

              case "select":
                if (!column) return null;
                return (
                  <Select
                    key={filter.columnId}
                    value={(column.getFilterValue() as string) ?? "all"}
                    onValueChange={(v) => {
                      handleSingleFilterChange(filter.columnId, v);
                      onSearchChange({ pageIndex: "0" });
                    }}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{filter.label}</SelectItem>
                      {filter.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );

              case "text":
              default:
                return (
                  <Input
                    key={filter.columnId}
                    placeholder={filter.label}
                    value={search[filter.columnId] || ""}
                    onChange={(e) =>
                      onSearchChange({
                        pageIndex: "0",
                        [filter.columnId]:
                          e.target.value === "" ? undefined : e.target.value,
                      })
                    }
                    className="w-full md:w-40"
                  />
                );
            }
          })}

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={() => {
                clearAllFilters();
                setGlobalFilter("");

                // Clear URL-level filters as well (q + daterange + text filters)
                const reset: Record<string, string | undefined> = {
                  q: undefined,
                  startDate: undefined,
                  endDate: undefined,
                  pageIndex: "0",
                  pageSize: String(serverPageSize),
                };

                customFilters.forEach((f) => {
                  if (f.type === "text") reset[f.columnId] = undefined;
                  if (f.type === "select" || f.type === "multi") {
                    reset[f.columnId] = undefined;
                  }
                });

                onSearchChange(reset);
              }}
            >
              Filtreleri Temizle ({activeFilters.length})
            </Button>
          )}
        </div>

        {showColumnVisibilityToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:flex">
              <Button
                variant="outline"
                className="border-muted bg-background hover:bg-accent font-normal text-muted-foreground"
              >
                Sütunlar <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (col) =>
                    !col.columnDef.meta?.isFilterOnly && col.getCanHide(),
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.columnDef.meta?.filterTitle ??
                      String(column.columnDef.header)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-md border relative">
        {/* Table */}
        <table className="w-full caption-bottom text-sm table-fixed">
          {/* Header */}
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers
                  .filter((h) => !h.column.columnDef.meta?.isFilterOnly)
                  .map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`sticky top-0 z-10 bg-muted ${
                        header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : ""
                      }`}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {!header.isPlaceholder && (
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanSort() &&
                            (header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            ))}
                        </div>
                      )}
                    </TableHead>
                  ))}
              </TableRow>
            ))}
          </TableHeader>

          {/* Scrollable body + footer */}
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={`even:bg-background odd:bg-muted/30 hover:bg-accent hover:cursor-pointer transition-colors duration-200 ${
                      getRowClassName?.(row.original) ?? ""
                    }`}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row
                      .getVisibleCells()
                      .filter(
                        (cell) => !cell.column.columnDef.meta?.isFilterOnly,
                      )
                      .map((cell) => {
                        const metaClass = cell.column.columnDef.meta?.className;
                        const className =
                          typeof metaClass === "function"
                            ? metaClass(cell.getValue() as TValue, row.original)
                            : (metaClass ?? "");

                        return (
                          <TableCell
                            key={cell.id}
                            className={className}
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                  </TableRow>

                  {row.getIsExpanded() && renderExpandedRow && (
                    <TableRow className="bg-muted/40">
                      <TableCell
                        colSpan={
                          table
                            .getVisibleLeafColumns()
                            .filter((c) => !c.columnDef.meta?.isFilterOnly)
                            .length
                        }
                        className="p-0"
                      >
                        <div className="w-full border-t bg-background">
                          {renderExpandedRow(row.original)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    table
                      .getVisibleLeafColumns()
                      .filter((c) => !c.columnDef.meta?.isFilterOnly).length
                  }
                  className="h-24 text-center"
                >
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableFooter>
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers
                  .filter((h) => !h.column.columnDef.meta?.isFilterOnly)
                  .map((header) => (
                    <TableCell
                      key={header.id}
                      className="whitespace-nowrap overflow-hidden"
                      style={{ width: header.column.getSize() }}
                    >
                      {!header.isPlaceholder &&
                        flexRender(
                          header.column.columnDef.footer,
                          header.getContext(),
                        )}
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </TableFooter>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-6 items-center pt-2 text-xs md:text-sm">
        <div className="text-muted-foreground flex-1 text-sm lg:flex">
          {total} kayıt
          {activeFilters.length > 0 && ` (${activeFilters.join(", ")})`}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <Label>Sayfa başı:</Label>
          <Select
            value={String(serverPageSize)}
            onValueChange={(v) => onServerPageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[20, 50, 100].map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          Sayfa {serverPageIndex + 1} / {pageCount}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={serverPageIndex === 0}
            onClick={() => onServerPageChange(0)}
            type="button"
            size="icon-sm"
          >
            <ChevronsLeftIcon />
          </Button>

          <Button
            variant="outline"
            disabled={serverPageIndex === 0}
            onClick={() => onServerPageChange(serverPageIndex - 1)}
            type="button"
            size="icon-sm"
          >
            <ChevronLeftIcon />
          </Button>

          <Button
            variant="outline"
            disabled={serverPageIndex >= pageCount - 1}
            onClick={() => onServerPageChange(serverPageIndex + 1)}
            type="button"
            size="icon-sm"
          >
            <ChevronRightIcon />
          </Button>

          <Button
            variant="outline"
            disabled={serverPageIndex >= pageCount - 1}
            onClick={() => onServerPageChange(pageCount - 1)}
            type="button"
            size="icon-sm"
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
