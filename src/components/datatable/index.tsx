// src/components/datatable/index.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  type ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'

import type { DataTableFilter, TableSearch } from './types'
import { useTableFilters } from '@/hooks/useTableFilters'
import DataTableControls from './DataTableControls'
import DataTableCore from './DataTableCore'
import DataTablePagination from './DataTablePagination'

interface DataTableProps<TData, TValue> {
  data: TData[]
  total: number
  serverPageIndex: number
  serverPageSize: number
  onServerPageChange: (p: number) => void
  onServerPageSizeChange: (s: number) => void
  getRowClassName?: (row: TData) => string
  columns: ColumnDef<TData, TValue>[]
  customFilters?: DataTableFilter[]

  search?: TableSearch
  onSearchChange?: (updates: TableSearch) => void

  onRowClick?: (row: TData) => void
  renderExpandedRow?: (row: TData) => React.ReactNode

  enableAutofocus?: boolean
  initialSorting?: SortingState
  initialColumnVisibility?: VisibilityState
  showColumnVisibilityToggle?: boolean
  allowedSortBy?: ReadonlyArray<string>
  isFetching?: boolean
  singleExpandedRow?: boolean
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
  allowedSortBy,
  isFetching,
  singleExpandedRow = true,
}: DataTableProps<TData, TValue>) {
  const globalFilter = search.q ?? ''

  const sorting: SortingState = useMemo(() => {
    if (search.sortBy) {
      const serverSortBy = String(search.sortBy)
      const serverSortColumn = columns.find((column) => {
        if (!('meta' in column) || !column.meta?.sortKey) return false
        return column.meta.sortKey === serverSortBy
      })
      const sortingColumnId = String(serverSortColumn?.id ?? serverSortBy)

      return [
        {
          id: sortingColumnId,
          desc: search.sortDir === 'desc',
        },
      ]
    }

    return initialSorting ?? []
  }, [search.sortBy, search.sortDir, initialSorting, columns])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  )

  useEffect(() => {
    if (!initialColumnVisibility) return

    setColumnVisibility((prev) => {
      if (Object.keys(prev).length > 0) return prev
      return initialColumnVisibility
    })
  }, [initialColumnVisibility])

  const [rowSelection, setRowSelection] = useState({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,

    state: {
      sorting,
      columnVisibility,
      rowSelection,
      expanded,
    },

    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,

    enableSortingRemoval: false,

    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater

      const s = next[0]
      const sortBy = s
        ? (table.getColumn(s.id)?.columnDef.meta?.sortKey ?? s.id)
        : undefined
      const isAllowedSort =
        !sortBy || !allowedSortBy || allowedSortBy.includes(sortBy)

      if (!isAllowedSort) return

      onSearchChange({
        sortBy,
        sortDir: s?.desc ? 'desc' : 'asc',
        pageIndex: 0,
      })
    },

    onColumnVisibilityChange: setColumnVisibility,

    onRowSelectionChange: setRowSelection,
    onExpandedChange: (updater) => {
      setExpanded((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater

        if (!singleExpandedRow) {
          return next
        }

        if (!next || next === true) {
          return {}
        }

        const expandedIds = Object.keys(next).filter(
          (id) => next[id as keyof typeof next],
        )

        if (expandedIds.length <= 1) {
          return next
        }

        const prevExpanded =
          prev && prev !== true
            ? Object.keys(prev).filter((id) => prev[id as keyof typeof prev])
            : []

        const newlyExpandedId =
          expandedIds.find((id) => !prevExpanded.includes(id)) ??
          expandedIds[expandedIds.length - 1]

        return { [newlyExpandedId]: true }
      })
    },

    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const {
    activeFilters,
    hasActiveFilters,
    handleMultiFilterChange,
    handleSingleFilterChange,
  } = useTableFilters({
    table,
    filters: customFilters,
    search,
    globalFilter,
  } as any)

  const safePageSize = Math.max(1, Number(serverPageSize) || 100)
  const safeTotal = Math.max(0, Number(total) || 0)
  const pageCount = Math.max(1, Math.ceil(safeTotal / safePageSize))
  const skeletonRowCount = Math.min(8, Math.max(3, safePageSize))

  return (
    <div className="flex flex-col gap-2 md:gap-4 p-2 md:p-4 relative">
      {/* 🔍 Search + Filters */}
      <DataTableControls
        table={table}
        search={search}
        customFilters={customFilters}
        activeFilters={activeFilters}
        hasActiveFilters={hasActiveFilters}
        handleMultiFilterChange={handleMultiFilterChange}
        handleSingleFilterChange={handleSingleFilterChange}
        onSearchChange={onSearchChange}
        serverPageSize={serverPageSize}
        showColumnVisibilityToggle={showColumnVisibilityToggle}
        enableAutofocus={enableAutofocus}
      />

      {/* Tables */}
      <DataTableCore
        table={table}
        renderExpandedRow={renderExpandedRow}
        onRowClick={onRowClick}
        getRowClassName={getRowClassName}
        allowedSortBy={allowedSortBy}
        isFetching={isFetching}
        skeletonRowCount={skeletonRowCount}
      />

      {/* Pagination */}
      <DataTablePagination
        total={total}
        serverPageIndex={serverPageIndex}
        serverPageSize={serverPageSize}
        pageCount={pageCount}
        activeFilters={activeFilters}
        onServerPageChange={onServerPageChange}
        onServerPageSizeChange={onServerPageSizeChange}
      />
    </div>
  )
}
