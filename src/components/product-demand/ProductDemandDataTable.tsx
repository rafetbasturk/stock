import type { ColumnDef } from '@tanstack/react-table'
import type { ProductDemandRow } from '@/types'
import type { DataTableFilter } from '@/components/datatable/types'
import type {
  ProductDemandSearch,
  SearchUpdates,
} from '@/lib/types/types.search'
import { useIsMobile } from '@/hooks/use-mobile'
import DataTable from '@/components/datatable'

interface ProductDemandDataTableProps {
  data: Array<ProductDemandRow>
  total: number
  pageIndex: number
  pageSize: number
  isFetching: boolean
  search: ProductDemandSearch
  columns: Array<ColumnDef<ProductDemandRow>>
  customFilters: Array<DataTableFilter>
  onSearchChange: (updates: SearchUpdates) => void
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  allowedSortBy?: ReadonlyArray<string>
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
  allowedSortBy,
}: ProductDemandDataTableProps) {
  const isMobile = useIsMobile()

  return (
    <div className="border rounded-lg shadow-sm">
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
        allowedSortBy={allowedSortBy}
        isFetching={isFetching}
        initialColumnVisibility={
          isMobile
            ? {
                customer_code: false,
                last_order_date: false,
              }
            : undefined
        }
        showColumnVisibilityToggle={!isMobile}
      />
    </div>
  )
}
