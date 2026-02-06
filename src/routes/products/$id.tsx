import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { productQuery } from '@/lib/queries/products'
import ProductForm from '@/components/products/ProductForm'
import { formatPrice } from '@/lib/currency'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Box,
  Calendar,
  CreditCard,
  Edit,
  Factory,
  Layers,
  LayoutGrid,
  Maximize2,
  Ruler,
  Tag,
  User,
} from 'lucide-react'
import type { ElementType } from 'react'

export const Route = createFileRoute('/products/$id')({
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
})

function RouteComponent() {
  const { id } = Route.useParams()
  const productId = parseProductId(id)
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
  const { data: product } = useSuspenseQuery(productQuery(productId))
  const [isEditing, setIsEditing] = useState(false)

  if (!product) return null

  const handleEditSuccess = () => {
    setIsEditing(false)
    toast.success('Product updated successfully')
  }

  const formattedPrice = formatPrice(
    product.price ?? 0,
    product.currency ?? 'TRY',
  )

  const hasLowStock =
    product.min_stock_level != null &&
    product.stock_quantity < product.min_stock_level

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={product.code}
        description={product.name}
        actions={
          <Button
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit className="size-4" />
            Düzenle
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Technical Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Factory className="size-5 text-muted-foreground" />
                Teknik Özellikler
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              <DetailItem
                icon={Layers}
                label="Malzeme"
                value={product.material}
              />
              <DetailItem icon={Box} label="Kaplama" value={product.coating} />
              <DetailItem
                icon={LayoutGrid}
                label="Son İşlem"
                value={product.post_process}
              />
              <DetailItem icon={Maximize2} label="Ölçü" value={product.specs} />
              <DetailItem
                icon={Ruler}
                label="Net Ölçü"
                value={product.specs_net}
              />
              <DetailItem
                icon={Tag}
                label="Diğer Kod"
                value={product.other_codes}
              />
            </CardContent>
          </Card>

          {product.customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="size-5 text-muted-foreground" />
                  Müşteri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailItem
                  icon={User}
                  label="Müşteri Adı"
                  value={product.customer.name}
                />
              </CardContent>
            </Card>
          )}

          {product.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notlar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {product.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Key Metrics / Sidebar */}
        <div className="space-y-6">
          <Card className="bg-muted/30 border-primary/10 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Stok Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold tracking-tight">
                  {product.stock_quantity}
                </span>
                <Badge variant="secondary" className="text-base font-normal">
                  {product.unit || 'Adet'}
                </Badge>
              </div>

              {hasLowStock && (
                <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/10 p-2 rounded-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span>
                  Kritik Stok Seviyesi ({product.min_stock_level})
                </div>
              )}

              <div className="pt-4 border-t flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minimum Stok</span>
                  <span className="font-mono">
                    {product.min_stock_level ?? '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Fiyatlandırma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formattedPrice}
                  </p>
                  <p className="text-xs text-muted-foreground">Birim Fiyat</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            <span>
              Son Güncelleme:{' '}
              {new Date(product.updated_at).toLocaleDateString('tr-TR')}
            </span>
          </div>
        </div>
      </div>

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

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number | null | undefined
  icon?: ElementType
}) {
  return (
    <div className="flex items-start gap-3 group">
      {Icon && (
        <div className="mt-0.5 shrink-0 text-muted-foreground/50 group-hover:text-primary/70 transition-colors">
          <Icon className="size-4" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">
          {value || <span className="text-muted-foreground/40">—</span>}
        </p>
      </div>
    </div>
  )
}
