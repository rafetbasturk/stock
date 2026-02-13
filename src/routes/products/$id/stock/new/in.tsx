import { StockMovementForm } from '@/components/stock/StockMovementForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$id/stock/new/in')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <div className="w-dvw h-dvh flex items-center justify-center p-2">
      <StockMovementForm id={Number(id)} type="IN" />
    </div>
  )
}
