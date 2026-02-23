import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/PageHeader'
import { StockMovementForm } from '@/components/stock/StockMovementForm'
import { StockMovementsTable } from '@/components/stock/StockMovementsTable'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const { t } = useTranslation(['stock', 'details'])
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

      <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('stock:adjust_stock')}</DialogTitle>
          </DialogHeader>
          <StockMovementForm
            id={productId}
            navigateOnSuccess={false}
            showCancel={false}
            onSuccess={() => setIsMovementOpen(false)}
          />
        </DialogContent>
      </Dialog>

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
