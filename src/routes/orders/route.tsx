import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ListOrdered } from 'lucide-react'

export const Route = createFileRoute('/orders')({
  component: RouteComponent,
  staticData: {
    sidebar: {
      label: 'nav.orders',
      icon: ListOrdered,
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
