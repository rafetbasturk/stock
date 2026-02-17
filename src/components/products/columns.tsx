import { DataTableRowActions } from '../DataTableRowActions'
import type { ColumnDef } from '@tanstack/react-table'
import type { ActionMenuItem, ProductListRow } from '@/types'
import { Badge } from '../ui/badge'

export const getColumns = (
  onEdit: (product: ProductListRow) => void,
  onDelete: (id: number) => void,
  onAdjustStock: (product: ProductListRow) => void,
  t: (key: string) => string,
): Array<ColumnDef<ProductListRow>> => {
  const productActions: Array<ActionMenuItem<ProductListRow>> = [
    {
      label: t('actions.stock_activity'),
      action: (product) => onAdjustStock(product),
      separatorAfter: true,
    },
    {
      label: t('actions.edit'),
      action: (product) => onEdit(product),
    },
    {
      label: t('actions.delete'),
      action: (product) => onDelete(product.id),
      isDestructive: true,
    },
  ]

  return [
    {
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      size: 50,
      cell: ({ row }) => (
        <DataTableRowActions row={row} actions={productActions} />
      ),
    },
    {
      accessorKey: 'code',
      header: t('products.columns.code'),
      size: 150,
      cell: ({ row }) => (
        <div className="font-medium truncate">{row.getValue('code')}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: t('products.columns.name'),
      minSize: 200,
      size: 300,
      cell: ({ row }) => <div className="truncate">{row.getValue('name')}</div>,
      enableHiding: false,
    },
    {
      accessorKey: 'price',
      header: () => (
        <div className="ml-auto">{t('products.columns.price')}</div>
      ),
      meta: { filterTitle: t('products.columns.price') },
      size: 120,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const price = Number(row.getValue('price')) / 100
        const formatted = new Intl.NumberFormat('tr', {
          style: 'currency',
          currency: row.original.currency || 'TRY',
        }).format(price)

        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: 'stock_quantity',
      header: () => (
        <div className="m-auto">{t('products.columns.stock_quantity')}</div>
      ),
      meta: { filterTitle: t('products.columns.stock_quantity') },
      enableGlobalFilter: false,
      size: 120,
      cell: ({ row }) => {
        const product = row.original
        const isLow = product.stock_quantity <= (product.min_stock_level || 0)
        return (
          <div className="text-center font-bold">
            <Badge variant={isLow ? 'destructive' : 'default'}>
              {product.stock_quantity} {product.unit}
            </Badge>
          </div>
        )
      },
      enableHiding: false,
      enableSorting: false,
    },
    {
      accessorKey: 'other_codes',
      header: t('products.columns.other_codes'),
      size: 150,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue('other_codes')}
        </div>
      ),
    },
    {
      accessorKey: 'material',
      header: t('products.columns.material'),
      size: 150,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue('material')}
        </div>
      ),
    },
    {
      accessorKey: 'post_process',
      header: t('products.columns.post_process'),
      size: 150,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue('post_process')}
        </div>
      ),
    },
    {
      accessorKey: 'coating',
      header: t('products.columns.coating'),
      size: 150,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue('coating')}
        </div>
      ),
    },
    {
      accessorKey: 'specs',
      header: t('products.columns.specs'),
      size: 120,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue('specs')}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'specs_net',
      header: t('products.columns.specs_net'),
      size: 120,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue('specs_net')}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'notes',
      header: t('products.columns.notes'),
      minSize: 200,
      size: 250,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue('notes')}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'customer',
      header: t('products.columns.customer'),
      size: 150,
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground truncate">
            {row.original.customer.name}
          </div>
        )
      },
    },
  ]
}
