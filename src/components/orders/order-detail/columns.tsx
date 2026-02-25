import type {
  DeliveryWithItems,
  OrderItemWithProduct,
  OrderWithItems,
} from '@/types'
import type { ColumnDef, Row } from '@tanstack/react-table'

export type OrderItemRow = OrderWithItems['items'][number]

export const getColumns = (
  deliveries: Array<DeliveryWithItems>,
): Array<ColumnDef<OrderItemRow>> => {
  const signedDeliveredQuantity = (delivery: DeliveryWithItems, qty: number) =>
    delivery.kind === 'RETURN' ? -qty : qty

  const calculateSentQuantity = (row: Row<OrderItemWithProduct>) => {
    return deliveries.reduce((sum, delivery) => {
      const item = delivery.items.find(
        (d) => d.order_item_id === row.original.id,
      )
      if (!item) return sum
      return sum + signedDeliveredQuantity(delivery, item.delivered_quantity || 0)
    }, 0)
  }

  return [
    {
      accessorKey: 'order_no',
      header: () => <div className="text-center">Sıra No</div>,
      size: 50,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
      footer: () => <div className="font-bold text-right">Toplam:</div>,
    },
    {
      accessorKey: 'product.code',
      header: 'Ürün Kodu',
      size: 140,
      cell: ({ row }) => (
        <div className="truncate">{row.original.product.code}</div>
      ),
    },
    {
      accessorKey: 'product.name',
      header: 'Ürün Adı',
      minSize: 200,
      size: 300,
      cell: ({ row }) => (
        <div className="truncate">{row.original.product.name}</div>
      ),
    },
    {
      accessorKey: 'product.stock_quantity',
      header: () => <div className="text-center">Stok Adedi</div>,
      meta: {
        filterTitle: 'Stok Adedi',
      },
      size: 120,
      cell: ({ row }) => {
        const stockQuantity = Number(row.original.product.stock_quantity)
        const minStockLevel = Number(row.original.product.min_stock_level)

        const stockClassName =
          stockQuantity <= minStockLevel ? 'text-red-500' : 'text-green-600'

        return (
          <div className={`text-center font-bold ${stockClassName}`}>
            {stockQuantity}
          </div>
        )
      },
    },
    {
      accessorKey: 'quantity',
      header: () => <div className="text-center">Sipariş Adedi</div>,
      meta: {
        filterTitle: 'Sipariş Adedi',
      },
      size: 120,
      cell: ({ row }) => (
        <div className="text-center font-bold">{row.original.quantity}</div>
      ),
      footer: ({ table }) => {
        const total = table
          .getFilteredRowModel()
          .rows.reduce((sum, r) => sum + r.original.quantity, 0)
        return <div className="text-center font-bold">{total}</div>
      },
    },
    {
      id: 'sent_quantity',
      header: () => <div className="text-center">Gönderilen Adet</div>,
      meta: {
        filterTitle: 'Gönderilen Adet',
      },
      size: 120,
      cell: ({ row }) => {
        const sent = calculateSentQuantity(row)

        return <div className="text-center font-medium">{sent}</div>
      },
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, r) => {
          return (
            sum +
            deliveries.reduce((s, delivery) => {
              const item = delivery.items.find(
                (d) => d.order_item_id === r.original.id,
              )
              if (!item) return s
              return (
                s +
                signedDeliveredQuantity(delivery, item.delivered_quantity || 0)
              )
            }, 0)
          )
        }, 0)
        return <div className="text-center font-bold">{total}</div>
      },
    },
    {
      id: 'left_quantity',
      header: () => <div className="text-center">Kalan Adet</div>,
      meta: {
        filterTitle: 'Kalan Adet',
      },
      size: 120,
      cell: ({ row }) => {
        const sent = calculateSentQuantity(row)

        const left = row.original.quantity - sent

        const colorClass = left > 0 ? 'text-orange-600' : 'text-green-600'

        return (
          <div className={`text-center font-bold ${colorClass}`}>{left}</div>
        )
      },
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, r) => {
          const sent = calculateSentQuantity(r)

          return sum + (r.original.quantity - sent)
        }, 0)
        return <div className="text-center font-bold">{total}</div>
      },
    },
    {
      accessorKey: 'unit_price',
      header: () => <div className="text-right">Birim Fiyatı</div>,
      meta: {
        filterTitle: 'Birim Fiyatı',
      },
      size: 120,
      cell: ({ row }) => {
        const amount = Number(row.original.unit_price) / 100
        const formatted = new Intl.NumberFormat('tr', {
          style: 'currency',
          currency: row.original.currency,
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      id: 'total',
      header: () => <div className="text-right">Toplam Tutar</div>,
      meta: {
        filterTitle: 'Toplam Tutar',
      },
      size: 120,
      cell: ({ row }) => {
        const amount = (row.original.quantity * row.original.unit_price) / 100
        const formatted = new Intl.NumberFormat('tr', {
          style: 'currency',
          currency: row.original.currency,
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
      footer: ({ table }) => {
        const rows = table.getFilteredRowModel().rows
        const totalAmount = rows.reduce(
          (sum, r) => sum + (r.original.quantity * r.original.unit_price) / 100,
          0,
        )
        const currency = rows.length > 0 ? rows[0].original.currency : 'TRY'
        const formatted = new Intl.NumberFormat('tr', {
          style: 'currency',
          currency,
        }).format(totalAmount)

        return <div className="text-right font-bold">{formatted}</div>
      },
    },
  ]
}
