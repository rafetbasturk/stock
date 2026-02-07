import { DataTableRowActions } from '../DataTableRowActions'
import type { ColumnDef } from '@tanstack/react-table'
import type { ActionMenuItem, Customer } from '@/types'

export const getColumns = (
  onEdit: (customer: Customer) => void,
  onDelete: (id: number) => void,
): Array<ColumnDef<Customer>> => {
  const customerActions: Array<ActionMenuItem<Customer>> = [
    {
      label: 'Düzenle',
      action: (customer) => onEdit(customer),
      separatorAfter: true,
    },
    {
      label: 'Sil',
      action: (customer) => onDelete(customer.id),
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
        <DataTableRowActions row={row} actions={customerActions} />
      ),
    },
    {
      accessorKey: 'code',
      header: 'Müşteri Kodu',
      size: 120,
      cell: ({ row }) => (
        <div className="font-medium truncate">{row.getValue('code')}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Müşteri Adı',
      minSize: 200,
      size: 250,
      cell: ({ row }) => <div className="truncate">{row.getValue('name')}</div>,
      enableHiding: false,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 200,
      cell: ({ row }) => (
        <div className="truncate">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      size: 160,
      cell: ({ row }) => (
        <div className="truncate">{row.getValue('phone')}</div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      minSize: 200,
      cell: ({ row }) => (
        <div className="truncate">{row.getValue('address')}</div>
      ),
    },
  ]
}
