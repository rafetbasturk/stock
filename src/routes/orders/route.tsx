import { createFileRoute, Outlet } from '@tanstack/react-router'
import { TerminalSquareIcon } from 'lucide-react'

export const Route = createFileRoute('/orders')({
  component: RouteComponent,
  staticData: {
    sidebar: {
      label: 'Siparişler',
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
