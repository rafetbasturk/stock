import { DeliveryProductsHistoryTable } from './DeliveryProductsHistoryTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { DeliveryListRow } from '@/types'
import type { DeliveriesSearch, SearchUpdates } from '@/lib/types/types.search'
import type { DataTableFilter } from '../datatable/types'
import DataTable from '@/components/datatable'

interface TableProps {
  deliveries: Array<DeliveryListRow>
  total: number
  pageIndex: number
  pageSize: number
  isFetching: boolean
  search: DeliveriesSearch
  columns: Array<ColumnDef<DeliveryListRow>>
  customFilters?: Array<DataTableFilter>
  onSearchChange: (updates: SearchUpdates) => void
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRowClick: (id: number) => void
  allowedSortBy?: ReadonlyArray<string>
}

export function DeliveriesDataTable({
  deliveries,
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
        data={deliveries}
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
        renderExpandedRow={(d) => <DeliveryProductsHistoryTable delivery={d} />}
        allowedSortBy={allowedSortBy}
        isFetching={isFetching}
      />
    </div>
  )
}
