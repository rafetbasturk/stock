import React from 'react'
import type { Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { ActionMenuItem } from '@/types'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  actions: ActionMenuItem<TData>[]
  alignment?: 'start' | 'center' | 'end' | undefined
}

export function DataTableRowActions<TData>({
  row,
  actions,
  alignment = 'start',
}: DataTableRowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" role="list" size="icon-sm">
          <span className="sr-only">Menüyü aç</span>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignment}>
        {actions.map((actionItem, index) => (
          <React.Fragment key={index}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                actionItem.action(row.original)
              }}
              className={actionItem.isDestructive ? 'text-red-500' : ''}
            >
              {actionItem.label}
            </DropdownMenuItem>
            {actionItem.separatorAfter && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
