import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
