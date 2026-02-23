import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableFilter } from '@/components/datatable/types'
import type { ProductDemandSearch } from '@/lib/types/types.search'
import type { ProductDemandRow } from './columns'
import DataTable from '@/components/datatable'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface ProductDemandDataTableProps {
  data: Array<ProductDemandRow>
  total: number
  pageIndex: number
  pageSize: number
  isFetching: boolean
  search: ProductDemandSearch
  columns: Array<ColumnDef<ProductDemandRow>>
  customFilters: Array<DataTableFilter>
  onSearchChange: (updates: Record<string, string | number | undefined>) => void
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function ProductDemandDataTable({
  data,
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
}: ProductDemandDataTableProps) {
  return (
    <div className="mt-6 border rounded-lg shadow-sm">
      {isFetching && <LoadingSpinner variant="inline" />}
      <DataTable
        data={data}
        columns={columns}
        total={total}
        search={search}
        customFilters={customFilters}
        serverPageIndex={pageIndex}
        serverPageSize={pageSize}
        onSearchChange={onSearchChange}
        onServerPageChange={onPageChange}
        onServerPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
