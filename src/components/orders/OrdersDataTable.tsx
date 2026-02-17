import { OrderProductHistoryTable } from './OrderProductHistoryTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { OrderListRow } from '@/types'
import type { OrdersSearch } from '@/lib/types/types.search'
import type { DataTableFilter } from '@/components/DataTable'
import DataTable from '@/components/DataTable'
import { LoadingSpinner } from '@/components/LoadingSpinner'

type SearchUpdates = Record<string, string | number | undefined>

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
}: TableProps) {
  return (
    <div className="mt-6 border rounded-lg shadow-sm">
      {isFetching && <LoadingSpinner variant="inline" />}
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
      />
    </div>
  )
}
