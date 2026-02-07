import { Outlet, createFileRoute } from '@tanstack/react-router'
import { PackageMinusIcon } from 'lucide-react'

export const Route = createFileRoute('/deliveries')({
  component: RouteComponent,
  staticData: {
    sidebar: {
      label: "nav.deliveries",
      icon: PackageMinusIcon,
      order: 50,
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
