import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Calendar, Edit, ListTodo, MapPin, ReceiptText, UserRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { ElementType } from 'react'
import OrderForm from '@/components/orders/OrderForm'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { orderQuery } from '@/lib/queries/orders'

export const Route = createFileRoute('/orders/$id')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const orderId = parseOrderId(params.id)
    if (orderId === null) {
      throw redirect({
        to: '/orders',
        search: {
          pageIndex: 0,
          pageSize: 100,
          sortBy: 'order_date',
          sortDir: 'desc',
        },
      })
    }

    return await context.queryClient.ensureQueryData(orderQuery(orderId))
  },
})

function RouteComponent() {
  const { id } = Route.useParams()
  const orderId = parseOrderId(id)

  if (orderId === null) {
    throw redirect({
      to: '/orders',
      search: {
        pageIndex: 0,
        pageSize: 100,
        sortBy: 'order_date',
        sortDir: 'desc',
      },
    })
  }

  const { data: order } = useSuspenseQuery(orderQuery(orderId))
  const [isEditing, setIsEditing] = useState(false)

  if (!order) {
    throw redirect({
      to: '/orders',
      search: {
        pageIndex: 0,
        pageSize: 100,
        sortBy: 'order_date',
        sortDir: 'desc',
      },
    })
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    toast.success('Sipariş güncellendi')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={order.order_number}
        description={order.customer.name}
        actions={
          <Button size="sm" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="size-4" />
            Düzenle
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sipariş Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <DetailItem icon={ReceiptText} label="Sipariş No" value={order.order_number} />
          <DetailItem icon={UserRound} label="Müşteri" value={order.customer.name} />
          <DetailItem icon={ListTodo} label="Durum" value={order.status} />
          <DetailItem icon={ReceiptText} label="Para Birimi" value={order.currency} />
          <DetailItem
            icon={Calendar}
            label="Sipariş Tarihi"
            value={new Date(order.order_date).toLocaleDateString('tr-TR')}
          />
          <DetailItem icon={MapPin} label="Teslimat Adresi" value={order.delivery_address} />
        </CardContent>
      </Card>

      {isEditing && (
        <OrderForm
          item={order}
          isSubmitting={false}
          onClose={() => setIsEditing(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

function parseOrderId(value: string) {
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
  icon: ElementType
}) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="mt-0.5 shrink-0 text-muted-foreground/50 group-hover:text-primary/70 transition-colors">
        <Icon className="size-4" />
      </div>
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
