import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$id/stock/history')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/products/$id/stock/history"!</div>
}
