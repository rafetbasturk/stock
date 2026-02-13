// src/hooks/useTableFilters.ts

import { useMemo } from 'react'
import type { Table } from '@tanstack/react-table'
import type { DataTableFilter } from '@/components/DataTable'

type TableSearch = Record<string, string | undefined>

interface UseTableFiltersProps<TData> {
  table: Table<TData>
  filters?: DataTableFilter[]
  search?: TableSearch
  globalFilter?: string
}

export function useTableFilters<TData>({
  table,
  filters = [],
  search = {},
  globalFilter,
}: UseTableFiltersProps<TData>) {
  /*
  These still update React Table state for UI behavior,
  but URL remains authoritative
  */

  const handleSingleFilterChange = (columnId: string, value: string) => {
    table
      .getColumn(columnId)
      ?.setFilterValue(value === 'all' || value === '' ? undefined : value)
  }

  const handleMultiFilterChange = (
    columnId: string,
    selectedValues: string[],
  ) => {
    table
      .getColumn(columnId)
      ?.setFilterValue(selectedValues.length ? selectedValues : undefined)
  }

  /*
  Active filters derived from URL ONLY
  */

  const activeFilters = useMemo(() => {
    const items: string[] = []

    /*
    Global search
    */

    const q = globalFilter?.trim()

    if (q) {
      items.push(`Ara: ${q}`)
    }

    /*
    Date range
    */

    const start = search.startDate
    const end = search.endDate

    if (start || end) {
      items.push(`Tarih: ${start ?? '…'} - ${end ?? '…'}`)
    }

    /*
    Column filters (URL driven)
    */

    for (const filter of filters) {
      if (filter.isVirtual) continue

      const raw = search[filter.columnId]

      if (!raw) continue

      /*
      Text
      */

      if (filter.type === 'text') {
        items.push(`${filter.label}: ${raw}`)

        continue
      }

      /*
      Select
      */

      if (filter.type === 'select') {
        const label = filter.options?.find((o) => o.value === raw)?.label ?? raw

        items.push(`${filter.label}: ${label}`)

        continue
      }

      /*
      Multi
      */

      if (filter.type === 'multi') {
        const values = raw.split(',')

        const labels = filter.options?.length
          ? values.map(
              (v) => filter.options!.find((o) => o.value === v)?.label ?? v,
            )
          : values

        items.push(`${filter.label}: ${labels.join(', ')}`)

        continue
      }
    }

    return items
  }, [filters, search, globalFilter])

  const hasActiveFilters = activeFilters.length > 0

  /*
  Clear helpers (still update React Table UI state)
  */

  const clearAllFilters = () => {
    table.setColumnFilters([])
  }

  const clearFilter = (columnId: string) => {
    table.getColumn(columnId)?.setFilterValue(undefined)
  }

  return {
    handleSingleFilterChange,
    handleMultiFilterChange,

    activeFilters,
    hasActiveFilters,

    clearAllFilters,
    clearFilter,
  }
}
