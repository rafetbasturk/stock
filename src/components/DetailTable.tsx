// src/components/DetailTable.tsx
import { Fragment } from "react";
import {
  
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import type {ColumnDef} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DetailTableProps<TData, TValue> {
  data: Array<TData>;
  columns: Array<ColumnDef<TData, TValue>>;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;
  renderExpandedRow?: (row: TData) => React.ReactNode;
}

export function DetailTable<TData, TValue>({
  data,
  columns,
  onRowClick,
  getRowClassName,
  renderExpandedRow,
}: DetailTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table className="w-full">
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={table.getAllLeafColumns().length}
                className="text-center py-6"
              >
                Kayıt bulunamadı.
              </TableCell>
            </TableRow>
          )}

          {table.getRowModel().rows.map((row) => (
            <Fragment key={row.id}>
              <TableRow
                className={`hover:bg-accent/40 cursor-pointer transition-colors ${
                  getRowClassName?.(row.original) ?? ""
                }`}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>

              {row.getIsExpanded() && renderExpandedRow && (
                <TableRow className="bg-muted/30">
                  <TableCell
                    colSpan={row.getVisibleCells().length}
                    className="p-0"
                  >
                    {renderExpandedRow(row.original)}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>

        {/* ✅ FOOTER (totals row) */}
        <TableFooter className="bg-muted/50">
          {table.getFooterGroups().map((footerGroup) => (
            <TableRow key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="py-3"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableFooter>
      </Table>
    </div>
  );
}
