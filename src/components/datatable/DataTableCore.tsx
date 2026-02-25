import { Fragment } from 'react/jsx-runtime'
import { flexRender } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Cell, Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface DataTableCoreProps<TData> {
  table: Table<TData>
  renderExpandedRow?: (row: TData) => React.ReactNode
  onRowClick?: (row: TData) => void
  getRowClassName?: (row: TData) => string
  allowedSortBy?: ReadonlyArray<string>
  isFetching?: boolean
  skeletonRowCount?: number
}

export default function DataTableCore<TData>({
  table,
  renderExpandedRow,
  onRowClick,
  getRowClassName,
  allowedSortBy,
  isFetching,
  skeletonRowCount = 12,
}: DataTableCoreProps<TData>) {
  const { t } = useTranslation('table')

  const rows = table.getRowModel().rows
  const isInitialLoading = Boolean(isFetching && rows.length === 0)
  const isBackgroundFetching = Boolean(isFetching && rows.length > 0)
  const visibleColumns = table
    .getVisibleLeafColumns()
    .filter((c) => !c.columnDef.meta?.isFilterOnly)

  const visibleLeafColumnCount = visibleColumns.length

  const getMobileCellLabel = (cell: Cell<TData, unknown>) => {
    const filterTitle = cell.column.columnDef.meta?.filterTitle
    if (filterTitle) return String(filterTitle)

    if (typeof cell.column.columnDef.header === 'string') {
      return cell.column.columnDef.header
    }

    return (
      cell.column.id.split('.').pop()?.replace(/[_-]+/g, ' ').trim() ||
      cell.column.id
    )
  }

  return (
    <div
      className="max-h-[70vh] overflow-auto rounded-md border"
      aria-busy={isFetching}
    >
      {/* Desktop */}
      <div className="hidden md:block">
        <table className="w-full caption-bottom text-sm table-fixed">
          {/* Header */}
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers
                    .filter((h) => !h.column.columnDef.meta?.isFilterOnly)
                    .map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={`sticky top-0 z-10 bg-muted ${
                          header.column.getCanSort() &&
                          (!allowedSortBy ||
                            allowedSortBy.includes(
                              header.column.columnDef.meta?.sortKey ??
                                header.column.id,
                            ))
                            ? 'cursor-pointer select-none'
                            : ''
                        }`}
                        onClick={
                          header.column.getCanSort() &&
                          (!allowedSortBy ||
                            allowedSortBy.includes(
                              header.column.columnDef.meta?.sortKey ??
                                header.column.id,
                            ))
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        {!header.isPlaceholder &&
                          (() => {
                            const headerAlign = (
                              header.column.columnDef.meta as any
                            )?.headerAlign as
                              | 'left'
                              | 'center'
                              | 'right'
                              | undefined
                            const justifyClass =
                              headerAlign === 'center'
                                ? 'justify-center'
                                : headerAlign === 'right'
                                  ? 'justify-end'
                                  : 'justify-start'
                            return (
                              <div
                                className={cn(
                                  'flex w-full items-center gap-1.5 whitespace-nowrap',
                                  justifyClass,
                                )}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                                {header.column.getCanSort() &&
                                  (!allowedSortBy ||
                                    allowedSortBy.includes(
                                      header.column.columnDef.meta?.sortKey ??
                                        header.column.id,
                                    )) &&
                                  (header.column.getIsSorted() === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  ) : header.column.getIsSorted() === 'desc' ? (
                                    <ArrowDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  ) : (
                                    <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  ))}
                              </div>
                            )
                          })()}
                      </TableHead>
                    ))}
                </TableRow>
              )
            })}
          </TableHeader>
          {/* Scrollable body + footer */}
          <TableBody>
            {isInitialLoading ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                <TableRow
                  key={`skeleton-desktop-${rowIndex}`}
                  className="even:bg-background odd:bg-muted/30"
                >
                  {visibleColumns.map((column, columnIndex) => (
                    <TableCell
                      key={`${column.id}-skeleton-${rowIndex}-${columnIndex}`}
                      style={{ width: column.getSize() }}
                    >
                      <div className="h-10 w-full rounded bg-primary/10 animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={`even:bg-background odd:bg-muted/30 ${onRowClick ? 'hover:bg-accent cursor-pointer' : ''} transition-colors duration-200 ${
                      getRowClassName?.(row.original) ?? ''
                    }`}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row
                      .getVisibleCells()
                      .filter(
                        (cell) => !cell.column.columnDef.meta?.isFilterOnly,
                      )
                      .map((cell) => {
                        const metaClass = cell.column.columnDef.meta?.className
                        const className =
                          typeof metaClass === 'function'
                            ? metaClass(cell.getValue(), row.original)
                            : (metaClass ?? '')
                        return (
                          <TableCell
                            key={cell.id}
                            className={className}
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        )
                      })}
                  </TableRow>
                  {row.getIsExpanded() && renderExpandedRow && (
                    <TableRow className="bg-muted/40">
                      <TableCell
                        colSpan={visibleLeafColumnCount}
                        className="p-0"
                      >
                        <div className="w-full border-t bg-background">
                          {renderExpandedRow(row.original)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleLeafColumnCount}
                  className="h-24 text-center"
                >
                  {t('no_results')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {/* Footer */}
          <TableFooter>
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers
                  .filter((h) => !h.column.columnDef.meta?.isFilterOnly)
                  .map((header) => (
                    <TableCell
                      key={header.id}
                      className="whitespace-nowrap overflow-hidden"
                      style={{ width: header.column.getSize() }}
                    >
                      {!header.isPlaceholder &&
                        flexRender(
                          header.column.columnDef.footer,
                          header.getContext(),
                        )}
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </TableFooter>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-4 p-2">
        {isInitialLoading ? (
          Array.from({ length: Math.min(4, skeletonRowCount) }).map((_, i) => (
            <div
              key={`skeleton-mobile-${i}`}
              className="border rounded-lg p-4 shadow-sm bg-background space-y-2"
            >
              <div className="h-4 w-2/5 rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-full rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-2/5 rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-full rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-4/5 rounded bg-primary/10 animate-pulse" />
            </div>
          ))
        ) : rows.length ? (
          rows.map((row) => {
            const orderNumberCell = row
              .getVisibleCells()
              .find(
                (cell) =>
                  cell.column.id === 'order_number' ||
                  cell.column.id === 'delivery_number' ||
                  cell.column.id === 'code',
              )
            const visibleCells = row.getVisibleCells()
            const actionsCell = visibleCells.find(
              (cell) => cell.column.id === 'actions',
            )
            return (
              <div
                key={row.id}
                className="border rounded-lg p-3 shadow-sm bg-background"
                onClick={() => onRowClick?.(row.original)}
              >
                {/* Header row */}
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-sm text-primary">
                    {orderNumberCell &&
                      flexRender(
                        orderNumberCell.column.columnDef.cell,
                        orderNumberCell.getContext(),
                      )}
                  </div>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Actions dropdown trigger */}
                    {actionsCell &&
                      flexRender(
                        actionsCell.column.columnDef.cell,
                        actionsCell.getContext(),
                      )}
                    {/* Expand toggle */}
                    {renderExpandedRow && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => row.toggleExpanded()}
                      >
                        {row.getIsExpanded() ? '▼' : '▶'}
                      </Button>
                    )}
                  </div>
                </div>
                {/* Content */}
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {visibleCells.map((cell) => {
                    if (
                      cell.column.id === 'expand-toggle' ||
                      cell.column.id === 'actions' ||
                      cell.column.id === 'order_number' ||
                      cell.column.id === 'delivery_number' ||
                      cell.column.id === 'code'
                    )
                      return null
                    return (
                      <div
                        key={cell.id}
                        className="grid grid-cols-[minmax(84px,1fr)_minmax(0,1.4fr)] items-center gap-2"
                      >
                        <span className="font-medium text-foreground leading-5">
                          {getMobileCellLabel(cell)}
                        </span>
                        <span className="text-right wrap-break-word leading-5 min-w-0">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {/* Expanded content */}
                {row.getIsExpanded() && renderExpandedRow && (
                  <div className="mt-3 border-t pt-3">
                    {renderExpandedRow(row.original)}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('no_results')}
          </div>
        )}
      </div>
      {isBackgroundFetching && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div
            className="rounded-md border bg-background/90 p-3 shadow-sm flex items-center justify-center"
            aria-live="polite"
          >
            <LoadingSpinner text={t('updating')} variant="inline" />
          </div>
        </div>
      )}
    </div>
  )
}
