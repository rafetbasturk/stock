import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/deliveries/')({
  component: RouteComponent,
})

function RouteComponent() {
  const products = Route.useLoaderData()
  console.log(products)

  return <div>Hello "/deliveries/"!</div>
}
