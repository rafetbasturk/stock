import type { ColumnDef } from '@tanstack/react-table'

export type CustomItemRow = {
  id?: number
  name: string
  unit: string
  quantity: number
  unit_price: number
  currency: string
  notes: string | undefined | null
}

export const getCustomColumns = (): ColumnDef<CustomItemRow>[] => {
  return [
    {
      accessorKey: 'number',
      header: 'Sıra No',
      size: 50,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
      footer: () => <div className="font-bold">Toplam:</div>,
    },
    {
      accessorKey: 'name',
      header: 'Ürün Adı',
      minSize: 200,
      size: 300,
      cell: ({ row }) => <div className="truncate">{row.original.name}</div>,
    },
    {
      accessorKey: 'notes',
      enableSorting: false,
      header: 'Açıklama',
      minSize: 200,
      size: 300,
      cell: ({ row }) => (
        <div className="truncate">{row.original.notes || '-'}</div>
      ),
    },
    {
      accessorKey: 'unit',
      enableSorting: false,
      header: () => <div className="text-center">Birim</div>,
      meta: {
        filterTitle: 'Birim',
      },
      size: 80,
      cell: ({ row }) => <div className="text-center">{row.original.unit}</div>,
    },
    {
      accessorKey: 'quantity',
      enableSorting: false,
      header: () => <div className="text-center">Adet</div>,
      meta: {
        filterTitle: 'Adet',
      },
      size: 80,
      cell: ({ row }) => (
        <div className="text-center">{row.original.quantity}</div>
      ),
      footer: ({ table }) => {
        const total = table
          .getFilteredRowModel()
          .rows.reduce((sum, r) => sum + (r.original.quantity ?? 0), 0)
        return <div className="text-center font-bold">{total}</div>
      },
    },
    {
      accessorKey: 'unit_price',
      enableSorting: false,
      header: () => <div className="text-right">Birim Fiyat</div>,
      meta: {
        filterTitle: 'Birim Fiyatı',
      },
      size: 130,
      cell: ({ row }) => {
        const amount = row.original.unit_price / 100
        const formatted = new Intl.NumberFormat('tr', {
          style: 'currency',
          currency: row.original.currency || 'TRY',
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      id: 'total',
      header: () => <div className="text-right">Toplam</div>,
      meta: {
        filterTitle: 'Toplam',
      },
      size: 130,
      cell: ({ row }) => {
        const total =
          ((row.original.unit_price ?? 0) * (row.original.quantity ?? 0)) / 100
        const formatted = new Intl.NumberFormat('tr', {
          style: 'currency',
          currency: row.original.currency || 'TRY',
        }).format(total)
        return <div className="text-right">{formatted}</div>
      },
      footer: ({ table }) => {
        const totalAmount = table
          .getFilteredRowModel()
          .rows.reduce(
            (sum, r) =>
              sum +
              ((r.original.unit_price ?? 0) * (r.original.quantity ?? 0)) / 100,
            0,
          )
        const formatted = new Intl.NumberFormat('tr', {
          style: 'currency',
          currency:
            table.getFilteredRowModel().rows[0]?.original.currency || 'TRY',
        }).format(totalAmount)
        return <div className="text-right font-bold">{formatted}</div>
      },
    },
  ]
}
