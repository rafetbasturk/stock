import { Outlet, createFileRoute } from '@tanstack/react-router'
import { LucideFactory } from 'lucide-react'

export const Route = createFileRoute('/customers')({
  component: RouteComponent,
  staticData: {
    sidebar: {
      label: 'nav.customers',
      icon: LucideFactory,
      order: 40,
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
