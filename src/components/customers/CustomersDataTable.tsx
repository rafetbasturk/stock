import type { ColumnDef } from '@tanstack/react-table'
import type { Customer } from '@/types'
import type { CustomersSearch } from '@/lib/types/types.search'
import type { DataTableFilter } from '@/components/datatable/types'
import DataTable from '@/components/datatable'

type SearchUpdates = Record<string, string | number | undefined>

interface TableProps {
  customers: Array<Customer>
  total: number
  pageIndex: number
  pageSize: number
  isFetching: boolean
  search: CustomersSearch
  columns: Array<ColumnDef<Customer>>
  customFilters?: Array<DataTableFilter>
  onSearchChange: (updates: SearchUpdates) => void
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRowClick: (id: number) => void
  allowedSortBy?: ReadonlyArray<string>
}

export function CustomersDataTable({
  customers,
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
  allowedSortBy,
}: TableProps) {
  return (
    <div className="border rounded-lg shadow-sm">
      <DataTable
        data={customers}
        columns={columns}
        search={search}
        customFilters={customFilters}
        serverPageIndex={pageIndex}
        serverPageSize={pageSize}
        onServerPageChange={onPageChange}
        onServerPageSizeChange={onPageSizeChange}
        total={total}
        onSearchChange={onSearchChange}
        onRowClick={(row) => onRowClick(row.id)}
        allowedSortBy={allowedSortBy}
        isFetching={isFetching}
      />
    </div>
  )
}
