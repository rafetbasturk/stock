import { OrderProductHistoryTable } from './OrderProductHistoryTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { OrderListRow } from '@/types'
import type { OrdersSearch, SearchUpdates } from '@/lib/types/types.search'
import DataTable from '@/components/datatable'
import { DataTableFilter } from '../datatable/types'

interface TableProps {
  orders: Array<OrderListRow>
  total: number
  pageIndex: number
  pageSize: number
  isFetching: boolean
  search: OrdersSearch
  columns: Array<ColumnDef<OrderListRow>>
  customFilters?: Array<DataTableFilter>
  onSearchChange: (updates: SearchUpdates) => void
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRowClick: (id: number) => void
  allowedSortBy?: ReadonlyArray<string>
}

export function OrdersDataTable({
  orders,
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
    <div className="mt-6 border rounded-lg shadow-sm">
      <DataTable
        data={orders}
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
        renderExpandedRow={(o) => <OrderProductHistoryTable order={o} />}
        allowedSortBy={allowedSortBy}
        isFetching={isFetching}
      />
    </div>
  )
}
