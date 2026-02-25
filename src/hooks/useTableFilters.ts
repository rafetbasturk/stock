// src/hooks/useTableFilters.ts
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Table } from '@tanstack/react-table'
import type { DataTableFilter, TableSearch } from '@/components/datatable/types'

interface UseTableFiltersProps<TData> {
  table: Table<TData>
  filters?: Array<DataTableFilter>
  search?: TableSearch
  globalFilter?: string
}

export function useTableFilters<TData>({
  table,
  filters = [],
  search = {},
  globalFilter,
}: UseTableFiltersProps<TData>) {
  const { t } = useTranslation('table')
  const hasColumn = (columnId: string) =>
    table.getAllLeafColumns().some((column) => column.id === columnId)
  /*
  These still update React Table state for UI behavior,
  but URL remains authoritative
  */

  const handleSingleFilterChange = (columnId: string, value: string) => {
    if (!hasColumn(columnId)) return
    table
      .getColumn(columnId)
      ?.setFilterValue(value === 'all' || value === '' ? undefined : value)
  }

  const handleMultiFilterChange = (
    columnId: string,
    selectedValues: Array<string>,
  ) => {
    if (!hasColumn(columnId)) return
    table
      .getColumn(columnId)
      ?.setFilterValue(selectedValues.length ? selectedValues : undefined)
  }

  /*
  Active filters derived from URL ONLY
  */

  const activeFilters = useMemo(() => {
    const items: Array<string> = []

    /*
    Global search
    */

    const q = globalFilter?.trim()

    if (q) {
      items.push(`${t('active_filters.search')}: ${q}`)
    }

    /*
    Date range
    */

    const start = search.startDate
    const end = search.endDate

    if (start || end) {
      items.push(`${t('active_filters.date')}: ${start ?? '…'} - ${end ?? '…'}`)
    }

    /*
    Column filters (URL driven)
    */

    for (const filter of filters) {
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
        const values = String(raw).split(',')

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
  }, [filters, search, globalFilter, t])

  const hasActiveFilters = activeFilters.length > 0

  return {
    handleSingleFilterChange,
    handleMultiFilterChange,
    activeFilters,
    hasActiveFilters,
  }
}
