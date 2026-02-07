import { Outlet, createFileRoute } from '@tanstack/react-router'
import { TerminalSquareIcon } from 'lucide-react'
import { getLastOrderNumber } from '@/server/orders'

export const Route = createFileRoute('/orders')({
  component: RouteComponent,
  loader: async () => {
    return await getLastOrderNumber()
  },
  staticData: {
    sidebar: {
      label: 'nav.orders',
      icon: TerminalSquareIcon,
      order: 20,
    },
  },
})

function RouteComponent() {
  return (
    <div className="p-2 md:p-6">
      <Outlet />
    </div>
  )
}
