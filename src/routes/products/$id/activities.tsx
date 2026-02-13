import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowRightLeft, MinusCircle, PlusCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/PageHeader'
import { StockMovementsTable } from '@/components/stock/StockMovementsTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const navigate = useNavigate()
  const productId = parseProductId(id)

  if (productId === null) {
    throw redirectToProducts()
  }

  const { data: product } = useSuspenseQuery(productQuery(productId))

  const hasLowStock = product.stock_quantity < product.min_stock_level

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${product.code} · ${t('stock:stock_history')}`}
        description={product.name}
        actions={
          <>
            <Button
              className="gap-2"
              onClick={() =>
                navigate({
                  to: '/products/$id/stock/new/in',
                  params: { id },
                })
              }
            >
              <PlusCircle className="size-4" />
              {t('stock:stock_in')}
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() =>
                navigate({
                  to: '/products/$id/stock/new/out',
                  params: { id },
                })
              }
            >
              <MinusCircle className="size-4" />
              {t('stock:stock_out')}
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('stock:stock_inventory')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1">
                  {t('stock:code')}: {product.code}
                </Badge>
                <Badge variant="outline" className="px-2.5 py-1">
                  {t('stock:stock_quantity')}: {product.stock_quantity}{' '}
                  {product.unit}
                </Badge>
                <Badge
                  className={
                    hasLowStock
                      ? 'bg-destructive text-white'
                      : 'bg-emerald-600 text-white'
                  }
                >
                  {hasLowStock
                    ? t('details:products.fields.critical_stock_level', {
                        value: product.min_stock_level,
                      })
                    : `${t('details:products.fields.minimum_stock')}: ${product.min_stock_level}`}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border bg-background/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('stock:actions')}
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                <ArrowRightLeft className="size-4 text-primary" />
                <span>{t('stock:stock_history_desc')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            {t('stock:stock_history')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StockMovementsTable productId={productId} />
        </CardContent>
      </Card>
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
