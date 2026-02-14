import { StockMovementForm } from '@/components/stock/StockMovementForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$id/stock/new/out')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <div className="min-h-svh flex items-center justify-center p-2">
      <StockMovementForm id={Number(id)} type="OUT" />
    </div>
  )
}
