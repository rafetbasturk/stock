import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/PageHeader'
import { StockMovementDialog } from '@/components/stock/StockMovementDialog'
import { StockMovementsTable } from '@/components/stock/StockMovementsTable'
import { Button } from '@/components/ui/button'
import { productQuery } from '@/lib/queries/products'

export const Route = createFileRoute('/products/$id/activities')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const productId = parseProductId(params.id)
    if (productId === null) {
      throw redirectToProducts()
    }

    await context.queryClient.ensureQueryData(productQuery(productId))
  },
})

function RouteComponent() {
  const { t } = useTranslation('stock')
  const { id } = Route.useParams()
  const productId = parseProductId(id)
  const [isMovementOpen, setIsMovementOpen] = useState(false)

  if (productId === null) {
    throw redirectToProducts()
  }

  const { data: product } = useSuspenseQuery(productQuery(productId))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('stock:stock_history')}
        description={product.code}
        actions={
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setIsMovementOpen(true)}
          >
            <PlusCircle className="size-4" />
            {t('stock:add_activity')}
          </Button>
        }
      />

      <StockMovementDialog
        mode="create"
        productId={productId}
        open={isMovementOpen}
        onOpenChange={setIsMovementOpen}
      />

      <StockMovementsTable productId={productId} enableActions />
    </div>
  )
}

function parseProductId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function redirectToProducts() {
  return redirect({
    to: '/products',
    search: {
      pageIndex: 0,
      pageSize: 100,
      sortBy: 'code',
      sortDir: 'asc',
    },
  })
}
