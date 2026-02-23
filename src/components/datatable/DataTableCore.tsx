import { flexRender, type Table } from '@tanstack/react-table'
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Fragment } from 'react/jsx-runtime'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'

interface DataTableCoreProps<TData> {
  table: Table<TData>
  renderExpandedRow?: (row: TData) => React.ReactNode
  onRowClick?: (row: TData) => void
  getRowClassName?: (row: TData) => string
  allowedSortBy?: ReadonlyArray<string>
  isFetching?: boolean
}

export default function DataTableCore<TData>({
  table,
  renderExpandedRow,
  onRowClick,
  getRowClassName,
  allowedSortBy,
  isFetching,
}: DataTableCoreProps<TData>) {
  const { t } = useTranslation('table')

  const rows = table.getRowModel().rows

  const visibleLeafColumnCount = table
    .getVisibleLeafColumns()
    .filter((c) => !c.columnDef.meta?.isFilterOnly).length

  return (
    <div className="max-h-[70vh] overflow-auto rounded-md border relative">
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
            {rows.length ? (
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
      <div className="md:hidden space-y-4 p-4">
        {rows.length ? (
          rows.map((row) => {
            const orderNumberCell = row
              .getVisibleCells()
              .find((cell) => cell.column.id === 'order_number')
            const visibleCells = row.getVisibleCells()
            const actionsCell = visibleCells.find(
              (cell) => cell.column.id === 'actions',
            )
            return (
              <div
                key={row.id}
                className="border rounded-lg p-4 shadow-sm bg-background"
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
                  {/* Expand toggle */}
                  {renderExpandedRow && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        row.toggleExpanded()
                      }}
                    >
                      {row.getIsExpanded() ? '▼' : '▶'}
                    </Button>
                  )}
                </div>
                {/* Content */}
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {visibleCells.map((cell) => {
                    if (
                      cell.column.id === 'expand-toggle' ||
                      cell.column.id === 'actions' ||
                      cell.column.id === 'order_number'
                    )
                      return null
                    return (
                      <div key={cell.id} className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {cell.column.columnDef.meta?.filterTitle ??
                            String(cell.column.columnDef.header)}
                        </span>
                        <span className="text-right">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {/* Actions */}
                <div
                  className="mt-3 flex justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actionsCell &&
                    flexRender(
                      actionsCell.column.columnDef.cell,
                      actionsCell.getContext(),
                    )}
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
      {isFetching && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-20">
          <div className="animate-pulse text-sm text-muted-foreground">
            Loading...
          </div>
        </div>
      )}
    </div>
  )
}
