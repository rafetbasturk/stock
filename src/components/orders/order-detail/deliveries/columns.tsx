import type { DeliveryRow } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'

export const getColumns = (): Array<ColumnDef<DeliveryRow>> => {
  return [
    {
      accessorKey: 'order_no',
      header: () => <div className='text-center'>Sıra No</div>,
      size: 50,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
      footer: () => <div className="font-bold">Toplam:</div>,
    },
    {
      accessorKey: 'productCode',
      header: 'Ürün Kodu',
      minSize: 140,
      maxSize: 200,
      cell: ({ row }) => (
        <div className="truncate">{row.original.productCode}</div>
      ),
    },
    {
      accessorKey: 'productName',
      header: 'Ürün Adı',
      minSize: 200,
      size: 300,
      cell: ({ row }) => (
        <div className="truncate">{row.original.productName}</div>
      ),
    },
    {
      accessorKey: 'deliveredQuantity',
      header: () => <div className="text-center">Sevk Adedi</div>,
      size: 120,
      cell: ({ row }) => (
        <div className="text-center font-bold">
          {row.original.deliveredQuantity}
        </div>
      ),
      footer: ({ table }) => {
        const total = table
          .getFilteredRowModel()
          .rows.reduce((sum, r) => sum + r.original.deliveredQuantity, 0)
        return <div className="text-center font-bold">{total}</div>
      },
    },
    {
      accessorKey: 'unitPrice',
      header: () => <div className="text-right">Birim Fiyat</div>,
      size: 120,
      cell: ({ row }) => {
        const { unitPrice, currency } = row.original
        return (
          <div className="text-right">
            {(unitPrice / 100).toLocaleString('tr-TR', {
              style: 'currency',
              currency,
              minimumFractionDigits: 2,
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'totalAmount',
      header: () => <div className="text-right">Tutar</div>,
      size: 140,
      cell: ({ row }) => {
        const { totalAmount, currency } = row.original
        return (
          <div className="text-right">
            {(totalAmount / 100).toLocaleString('tr-TR', {
              style: 'currency',
              currency,
              minimumFractionDigits: 2,
            })}
          </div>
        )
      },
      footer: ({ table }) => {
        const total = table
          .getFilteredRowModel()
          .rows.reduce((sum, r) => sum + r.original.totalAmount, 0) / 100
        const currency =
          table.getFilteredRowModel().rows[0]?.original.currency || 'TRY'
        
        const formatted = new Intl.NumberFormat('tr', {
          style: 'currency',
          currency
        }).format(total)
        return (
          <div className="text-right font-bold">
            {formatted}
          </div>
        )
      },
    },
  ]
}
