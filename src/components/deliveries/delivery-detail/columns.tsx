// src/components/deliveries/deliveryItemsColumns.tsx
import { DeliveryItemRow } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'

export const getColumns = (): ColumnDef<DeliveryItemRow>[] => [
  // ROW NUMBER
  {
    id: 'row_number',
    header: () => <div className="text-center">Sıra No</div>,
    size: 40,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    footer: () => <div className="font-bold text-center">Toplam</div>,
  },

  // PRODUCT CODE
  {
    accessorKey: 'product_code',
    header: 'Ürün Kodu',
    size: 130,
    cell: ({ row }) => (
      <div className="truncate ">{row.original.product_code}</div>
    ),
  },

  // PRODUCT NAME
  {
    accessorKey: 'product_name',
    header: 'Ürün Adı',
    size: 260,
    cell: ({ row }) => (
      <div className="truncate max-w-60">{row.original.product_name}</div>
    ),
  },

  // ORDER NUMBER
  {
    accessorKey: 'order_number',
    size: 100,
    header: () => <div>Sipariş No</div>,
    meta: {
      filterTitle: 'Sipariş No',
    },
    cell: ({ row }) => <div>{row.original.order_number}</div>,
  },

  // ORDER DATE
  {
    accessorKey: 'order_date',
    header: () => <div>Sipariş Tarihi</div>,
    size: 100,
    meta: { filterTitle: 'Sipariş Tarihi' },
    cell: ({ row }) => (
      <div>{row.original.order_date.toLocaleDateString('tr-TR')}</div>
    ),
  },

  // DELIVERED QUANTITY
  {
    accessorKey: 'delivered_quantity',
    header: () => <div className="text-center">Adet</div>,
    size: 60,
    enableSorting: false,
    meta: { filterTitle: 'Adet' },
    cell: ({ row }) => (
      <div className="text-center">{row.original.delivered_quantity}</div>
    ),
    footer: ({ table }) => {
      const rows = table.getFilteredRowModel().rows
      const total = rows.reduce(
        (sum, r) => sum + r.original.delivered_quantity,
        0,
      )

      return <div className="text-center font-bold">{total}</div>
    },
  },

  // UNIT PRICE
  {
    accessorKey: 'unit_price',
    header: () => <div className="text-right">Birim Fiyat</div>,
    size: 120,
    enableSorting: false,
    meta: { filterTitle: 'Birim Fiyat' },
    cell: ({ row }) => {
      const { unit_price, currency } = row.original
      const formatted = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
      }).format(unit_price)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },

  // TOTAL PRICE
  {
    accessorKey: 'total_price',
    header: () => <div className="text-right">Tutar</div>,
    size: 120,
    meta: { filterTitle: 'Tutar' },
    cell: ({ row }) => {
      const { total_price, currency } = row.original
      const formatted = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
      }).format(total_price)

      return <div className="text-right font-medium">{formatted}</div>
    },
    footer: ({ table }) => {
      const rows = table.getFilteredRowModel().rows
      const total = rows.reduce((sum, r) => sum + r.original.total_price, 0)
      const currency = rows[0]?.original.currency ?? 'TRY'

      return (
        <div className="text-right font-bold">
          {total.toLocaleString('tr-TR', {
            style: 'currency',
            currency,
          })}
        </div>
      )
    },
  },
]
