import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Calendar, Edit, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { ElementType } from 'react'
import CustomerForm from '@/components/customers/CustomerForm'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { customerQuery } from '@/lib/queries/customers'

export const Route = createFileRoute('/customers/$id')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const customerId = parseCustomerId(params.id)
    if (customerId === null) {
      throw redirect({
        to: '/customers',
        search: {
          pageIndex: 0,
          pageSize: 100,
          sortBy: 'code',
          sortDir: 'asc',
        },
      })
    }

    return await context.queryClient.ensureQueryData(customerQuery(customerId))
  },
})

function RouteComponent() {
  const { id } = Route.useParams()
  const customerId = parseCustomerId(id)

  if (customerId === null) {
    throw redirect({
      to: '/customers',
      search: {
        pageIndex: 0,
        pageSize: 100,
        sortBy: 'code',
        sortDir: 'asc',
      },
    })
  }

  const { data: customer } = useSuspenseQuery(customerQuery(customerId))
  const [isEditing, setIsEditing] = useState(false)

  if (!customer) {
    throw redirect({
      to: '/customers',
      search: {
        pageIndex: 0,
        pageSize: 100,
        sortBy: 'code',
        sortDir: 'asc',
      },
    })
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    toast.success('Müşteri güncellendi')
  }

  return (
    <div className="space-y-6 mx-auto">
      <PageHeader
        title={customer.code}
        description={customer.name}
        actions={
          <Button size="sm" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="size-4" />
            Düzenle
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Müşteri Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <DetailItem icon={UserRound} label="Müşteri Kodu" value={customer.code} />
          <DetailItem icon={UserRound} label="Müşteri Adı" value={customer.name} />
          <DetailItem icon={Mail} label="Email" value={customer.email} />
          <DetailItem icon={Phone} label="Telefon" value={customer.phone} />
          <DetailItem icon={MapPin} label="Adres" value={customer.address} />
          <DetailItem
            icon={Calendar}
            label="Son Güncelleme"
            value={new Date(customer.updated_at).toLocaleDateString('tr-TR')}
          />
        </CardContent>
      </Card>

      {isEditing && (
        <CustomerForm
          item={customer}
          isSubmitting={false}
          onClose={() => setIsEditing(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

function parseCustomerId(value: string) {
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
