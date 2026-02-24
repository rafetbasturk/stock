import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DataTableFilter, TableSearch } from './types'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { debounce } from '@/lib/debounce'
import { DateRangeFilter } from '../DateRangeFilter'
import { MultiSelectFilter } from '../form/MultiSelectFilter'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Table } from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

interface DataTableControlsProps<TData> {
  search: TableSearch
  customFilters: DataTableFilter[]
  activeFilters: string[]
  hasActiveFilters: boolean
  handleMultiFilterChange: (columnId: string, selectedValues: string[]) => void
  handleSingleFilterChange: (columnId: string, value: string) => void
  onSearchChange: (updates: Record<string, any>, replaceAll?: boolean) => void
  serverPageSize: number
  table: Table<TData>
  showColumnVisibilityToggle?: boolean
  enableAutofocus?: boolean
}

export default function DataTableControls<TData>({
  search,
  customFilters,
  activeFilters,
  hasActiveFilters,
  handleMultiFilterChange,
  handleSingleFilterChange,
  onSearchChange,
  serverPageSize,
  table,
  showColumnVisibilityToggle = false,
  enableAutofocus = false,
}: DataTableControlsProps<TData>) {
  const { t } = useTranslation('table')
  const [searchInput, setSearchInput] = useState(search.q ?? '')

  useEffect(() => {
    setSearchInput(search.q ?? '')
  }, [search.q])

  const debouncedSearch = useMemo(() => {
    return debounce((value: string) => {
      if (value === search.q) return

      onSearchChange({
        q: value || undefined,
        pageIndex: 0,
      })
    }, 400)
  }, [onSearchChange, search.q])

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mobileDraftFilters, setMobileDraftFilters] = useState<TableSearch>({})

  const buildDraftFromSearch = () => {
    const draft: TableSearch = {}

    customFilters.forEach((filter) => {
      if (filter.type === 'daterange') {
        draft.startDate = search.startDate
        draft.endDate = search.endDate
      } else {
        draft[filter.columnId] = search[filter.columnId]
      }
    })

    return draft
  }

  useEffect(() => {
    if (!mobileFiltersOpen) return
    setMobileDraftFilters(buildDraftFromSearch())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileFiltersOpen])

  const buildResetPayload = () => {
    const reset: Record<string, string | number | undefined> = {
      q: undefined,
      startDate: undefined,
      endDate: undefined,
      pageIndex: 0,
      pageSize: serverPageSize,
    }

    customFilters.forEach((f) => {
      reset[f.columnId] = undefined
    })

    return reset
  }

  const renderFilter = (
    source: TableSearch,
    options?: { mobileDraft?: boolean },
  ) =>
    customFilters.map((filter) => {
      const isMobileDraft = options?.mobileDraft === true

      switch (filter.type) {
        case 'daterange':
          return (
            <DateRangeFilter
              key={filter.columnId}
              label={filter.label}
              start={source.startDate as string | undefined}
              end={source.endDate as string | undefined}
              onChange={(updates) => {
                if (isMobileDraft) {
                  setMobileDraftFilters((prev) => ({
                    ...prev,
                    ...updates,
                  }))
                  return
                }

                onSearchChange({
                  pageIndex: 0,
                  ...updates,
                })
              }}
            />
          )

        case 'multi':
          if (!filter.options) return null

          return (
            <MultiSelectFilter
              key={filter.columnId}
              filter={{
                columnId: filter.columnId,
                label: filter.label,
                options: filter.options,
              }}
              selectedValues={
                source[filter.columnId]
                  ? String(source[filter.columnId])!.split(',')
                  : []
              }
              onChange={(colId, values) => {
                if (isMobileDraft) {
                  setMobileDraftFilters((prev) => ({
                    ...prev,
                    [colId]: values.length ? values.join(',') : undefined,
                  }))
                  return
                }

                handleMultiFilterChange(colId, values)

                onSearchChange({
                  [colId]: values.length ? values.join(',') : undefined,
                  pageIndex: 0,
                })
              }}
            />
          )

        case 'select':
          if (!filter.options) return null

          return (
            <Select
              key={filter.columnId}
              value={String(source[filter.columnId] ?? 'all')}
              onValueChange={(v) => {
                if (isMobileDraft) {
                  setMobileDraftFilters((prev) => ({
                    ...prev,
                    [filter.columnId]: v === 'all' ? undefined : v,
                  }))
                  return
                }

                handleSingleFilterChange(filter.columnId, v)

                onSearchChange({
                  [filter.columnId]: v === 'all' ? undefined : v,
                  pageIndex: 0,
                })
              }}
            >
              <SelectTrigger className="w-full md:w-48 font-normal text-muted-foreground">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">{filter.label}</SelectItem>

                {filter.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )

        case 'text':
        default:
          return (
            <Input
              key={filter.columnId}
              placeholder={filter.label}
              value={String(source[filter.columnId] || '')}
              onChange={(e) => {
                if (isMobileDraft) {
                  setMobileDraftFilters((prev) => ({
                    ...prev,
                    [filter.columnId]:
                      e.target.value === '' ? undefined : e.target.value,
                  }))
                  return
                }

                onSearchChange({
                  pageIndex: 0,
                  [filter.columnId]:
                    e.target.value === '' ? undefined : e.target.value,
                })
              }}
              className="w-full md:w-40"
            />
          )
      }
    })

  return (
    <>
      <div className="hidden md:flex grow flex-col md:flex-row items-start md:items-center gap-2">
        <div className="grow flex flex-col md:flex-row items-start md:items-center gap-2">
          <Input
            placeholder={t('search_placeholder')}
            value={searchInput}
            onChange={(e) => {
              const value = e.target.value
              setSearchInput(value)
              debouncedSearch(value) // delayed server update
            }}
            autoFocus={enableAutofocus}
            className="w-full md:max-w-sm"
          />

          {renderFilter(search)}

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={() => {
                onSearchChange(buildResetPayload(), true)
              }}
            >
              {t('clear_filters', { count: activeFilters.length })}
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
                {t('columns')} <ChevronDown />
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

      <div className="md:hidden flex gap-2 w-full">
        <Input
          placeholder={t('search_placeholder')}
          value={searchInput}
          onChange={(e) => {
            const value = e.target.value
            setSearchInput(value)
            debouncedSearch(value)
          }}
          className="flex-1"
        />

        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">{t('filters')}</Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[85%] sm:w-100">
            <SheetHeader>
              <SheetTitle>{t('filters')}</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-4 p-4">
              {renderFilter(mobileDraftFilters, { mobileDraft: true })}

              <Button
                variant="outline"
                onClick={() => {
                  const reset = buildResetPayload()
                  setMobileDraftFilters(reset)
                  onSearchChange(reset, true)
                  setMobileFiltersOpen(false)
                }}
                className="w-full"
              >
                {t('clear_filters', { count: activeFilters.length })}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={() => {
                    onSearchChange(
                      {
                        ...mobileDraftFilters,
                        pageIndex: 0,
                      },
                      false,
                    )
                    setMobileFiltersOpen(false)
                  }}
                >
                  {t('apply')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
