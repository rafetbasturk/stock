import { createFileRoute, Outlet } from '@tanstack/react-router'
import { BarChart3Icon } from 'lucide-react'

export const Route = createFileRoute('/product-demand')({
  component: RouteComponent,
  staticData: {
    sidebar: {
      label: 'nav.product_demand',
      icon: BarChart3Icon,
      order: 70,
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
