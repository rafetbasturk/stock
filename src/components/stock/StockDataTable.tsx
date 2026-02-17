import { LoadingSpinner } from '../LoadingSpinner'
import DataTable, { DataTableFilter } from '../DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { MovementRow } from '@/types'
import { StockSearch } from '@/lib/types'

interface TableProps {
  stocks: Array<MovementRow>
  total: number
  pageIndex: number
  pageSize: number
  isFetching: boolean
  search: StockSearch
  columns: Array<ColumnDef<MovementRow>>
  customFilters?: Array<DataTableFilter>
  onSearchChange: (updates: Record<string, string | number | undefined>) => void
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRowClick: (row: MovementRow) => void
  getRowClassName?: (row: MovementRow) => string
}

export function StockDataTable({
  stocks,
  total,
  pageIndex,
  pageSize,
  isFetching,
  search,
  columns,
  customFilters,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  getRowClassName,
}: TableProps) {
  return (
    <div className="mt-6 border rounded-lg shadow-sm">
      {isFetching && <LoadingSpinner variant="inline" />}
      <DataTable
        columns={columns}
        data={stocks}
        total={total}
        search={search}
        customFilters={customFilters}
        serverPageIndex={pageIndex}
        serverPageSize={pageSize}
        enableAutofocus
        onSearchChange={onSearchChange}
        onServerPageChange={onPageChange}
        onServerPageSizeChange={onPageSizeChange}
        onRowClick={onRowClick}
        getRowClassName={getRowClassName}
      />
    </div>
  )
}
