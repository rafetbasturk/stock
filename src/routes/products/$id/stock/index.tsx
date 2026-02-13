import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$id/stock/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/products/$id/stock/"!</div>
}
