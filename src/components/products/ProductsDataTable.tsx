import type { ColumnDef } from '@tanstack/react-table'
import type { ProductListRow } from '@/types'
import type { ProductsSearch } from '@/lib/types/types.search'
import type { DataTableFilter } from '@/components/DataTable'
import DataTable from '@/components/DataTable'
import { LoadingSpinner } from '@/components/LoadingSpinner'

type SearchUpdates = Record<string, string | undefined>

interface ProductsDataTableProps {
  products: Array<ProductListRow>
  total: number
  pageIndex: number
  pageSize: number
  isFetching: boolean
  search: ProductsSearch
  columns: Array<ColumnDef<ProductListRow>>
  customFilters: Array<DataTableFilter>
  onSearchChange: (updates: SearchUpdates) => void
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRowClick: (id: number) => void
}

export function ProductsDataTable({
  products,
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
}: ProductsDataTableProps) {
  return (
    <div className="mt-6 border rounded-lg shadow-sm">
      {isFetching && <LoadingSpinner variant="inline" />}
      <DataTable
        data={products}
        columns={columns}
        search={search}
        customFilters={customFilters}
        serverPageIndex={pageIndex}
        serverPageSize={pageSize}
        onServerPageChange={onPageChange}
        onServerPageSizeChange={onPageSizeChange}
        total={total}
        onSearchChange={onSearchChange}
        initialColumnVisibility={{
          customer: false,
          specs: false,
          specs_net: false,
        }}
        onRowClick={(row) => onRowClick(row.id)}
      />
    </div>
  )
}
