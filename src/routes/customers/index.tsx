import { fetchCustomers } from '@/lib/queries/customers'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/customers/')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    data: customers,
    isFetching,
    status,
  } = useSuspenseQuery(fetchCustomers)
  console.log({ customers, isFetching, status })

  return <div>Hello "/customers/"!</div>
}
