import type { ColumnDef } from '@tanstack/react-table'

export type CustomDeliveryRow = {
  id?: number
  deliveryId: number
  name: string
  unit: string
  deliveredQuantity: number
  deliveryDate: Date
  deliveryNumber: string | null
  notes: string | null
  unitPrice: number
  totalAmount: number
  currency: string
}

export const getCustomDeliveryColumns = (): Array<ColumnDef<CustomDeliveryRow>> => {
  return [
    {
      accessorKey: 'name',
      header: 'Kalem Adı',
      size: 220,
      cell: ({ row }) => <div className="truncate">{row.original.name}</div>,
    },
    {
      accessorKey: 'notes',
      header: 'Açıklama',
      size: 200,
      cell: ({ row }) => <div className="truncate">{row.original.notes}</div>,
    },
    {
      accessorKey: 'unit',
      header: 'Birim',
      size: 80,
      cell: ({ row }) => (
        <div className="text-center capitalize">{row.original.unit}</div>
      ),
    },
    {
      accessorKey: 'deliveredQuantity',
      header: () => <div className="text-center">Teslim Edilen</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="text-center font-semibold">
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
      header: () => <div className="ml-auto">Birim Fiyat</div>,
      size: 120,
      cell: ({ row }) => {
        const { unitPrice, currency } = row.original
        return (
          <div className="text-right">
            {(unitPrice / 100).toLocaleString('tr-TR', {
              style: 'currency',
              currency,
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'totalAmount',
      header: () => <div className="ml-auto">Tutar</div>,
      size: 140,
      cell: ({ row }) => {
        const { totalAmount, currency } = row.original
        return (
          <div className="text-right">
            {(totalAmount / 100).toLocaleString('tr-TR', {
              style: 'currency',
              currency,
            })}
          </div>
        )
      },
      footer: ({ table }) => {
        const total = table
          .getFilteredRowModel()
          .rows.reduce((sum, r) => sum + r.original.totalAmount, 0)
        const currency =
          table.getFilteredRowModel().rows[0]?.original.currency || 'TRY'
        return (
          <div className="text-right font-bold">
            {(total / 100).toLocaleString('tr-TR', {
              style: 'currency',
              currency,
            })}
          </div>
        )
      },
    },
  ]
}
