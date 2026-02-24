import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Box,
  Calendar,
  CreditCard,
  Edit,
  Factory,
  InfoIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  MessageCircleWarningIcon,
  Ruler,
  Tag,
  User,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppTimeZone } from '@/hooks/useAppTimeZone'
import { useIsMobile } from '@/hooks/use-mobile'
import { productQuery } from '@/lib/queries/products'
import ProductForm from '@/components/products/ProductForm'
import { formatPrice } from '@/lib/currency'
import { formatDateTime } from '@/lib/datetime'
import { DetailItem } from '@/components/DetailItem'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/products/$id/')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const productId = parseProductId(params.id)
    if (productId === null) {
      throw redirect({
        to: '/products',
        search: {
          pageIndex: 0,
          pageSize: 100,
          sortBy: 'code',
          sortDir: 'asc',
        },
      })
    }

    return await context.queryClient.ensureQueryData(productQuery(productId))
  },
  notFoundComponent: ProductNotFound,
})

function RouteComponent() {
  const { t, i18n } = useTranslation('details')
  const timeZone = useAppTimeZone()
  const isMobile = useIsMobile()
  const { id } = Route.useParams()
  const productId = parseProductId(id)

  if (productId === null) {
    throw redirectToProducts()
  }

  const { data: product } = useSuspenseQuery(productQuery(Number(id)))
  const [isEditing, setIsEditing] = useState(false)

  if (!product) return null

  const handleEditSuccess = () => {
    setIsEditing(false)
    toast.success(t('products.updated_success'))
  }

  const formattedPrice = formatPrice(
    product.price ?? 0,
    product.currency ?? 'TRY',
  )

  const hasLowStock = product.stock_quantity <= product.min_stock_level

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('products.detail_page_title')}
        showActionsOnMobile
        actions={
          <>
            <Link to="/products/$id/activities" params={{ id }}>
              <Button size="sm" variant="outline">
                {t('actions.stock_activity')}
              </Button>
            </Link>
            {!isMobile && (
              <Button size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit className="size-4" />
                {t('actions.edit')}
              </Button>
            )}
          </>
        }
      />

      <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm space-y-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <InfoIcon className="size-5 sm:size-6" />
            {t('products.card_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 flex-1">
            <DetailItem
              icon={User}
              label={t('products.fields.code')}
              value={product.code}
              highlight
            />
            <DetailItem
              icon={User}
              label={t('products.fields.product_name')}
              value={product.name}
              className='truncate'
            />
            <DetailItem
              icon={User}
              label={t('products.fields.customer_name')}
              value={product.customer?.name}
              highlight
            />
            <DetailItem icon={Box} label={t('products.fields.unit')}>
              <Badge variant="secondary" className="text-sm font-mono">
                {product.unit}
              </Badge>
            </DetailItem>
            <DetailItem
              icon={Tag}
              label={t('products.fields.other_codes')}
              value={product.other_codes}
              highlight
            />
            <DetailItem
              icon={Box}
              label={t('products.fields.minimum_stock')}
              value={product.min_stock_level}
            />
            <DetailItem
              icon={Tag}
              label={t('products.fields.notes')}
              value={product.notes}
            />
            <DetailItem
              icon={Calendar}
              label={t('products.fields.updated_at')}
              value={formatDateTime(product.updated_at, {
                locale: i18n.language,
                timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
              highlight
            />
          </div>

          <div className="flex flex-col justify-between gap-4 border-t-2 border-t-primary/30 pt-10 md:border-none md:pt-0 md:min-w-45 md:items-end">
            <div className="flex flex-col md:items-end">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                <CreditCard className="size-5" />
                {t('products.fields.price')}
              </div>
              <Separator />
              <span className="text-xl sm:text-2xl font-bold text-primary">
                {formattedPrice}
              </span>
            </div>
            <div className="flex flex-col md:items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('products.fields.stock_quantity')}
              </span>
              <Separator />
              <span
                className={cn(
                  'text-xl sm:text-2xl font-bold text-primary',
                  hasLowStock && 'text-destructive',
                )}
              >
                {product.stock_quantity}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm space-y-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Factory className="size-5 text-muted-foreground" />
            {t('products.sections.tech_specs')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 flex-1">
            <DetailItem
              icon={Layers}
              label={t('products.fields.material')}
              value={product.material}
              highlight
            />
            <DetailItem
              icon={LayoutGrid}
              label={t('products.fields.post_process')}
              value={product.post_process}
              highlight
            />
            <DetailItem
              icon={Box}
              label={t('products.fields.coating')}
              value={product.coating}
              highlight
            />
            <DetailItem
              icon={Maximize2}
              label={t('products.fields.specs')}
              value={product.specs}
              highlight
            />
            <DetailItem
              icon={Ruler}
              label={t('products.fields.specs_net')}
              value={product.specs_net}
              highlight
            />
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <ProductForm
          item={product}
          isSubmitting={false}
          onClose={() => setIsEditing(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

function parseProductId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function ProductNotFound() {
  const { t } = useTranslation('details')
  return (
    <div className="space-x-6">
      <PageHeader title={t('products.not_found')} />
      <div className="h-40 flex items-center justify-center">
        <MessageCircleWarningIcon size={60} />
      </div>
    </div>
  )
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
