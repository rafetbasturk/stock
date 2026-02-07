import { tr } from 'date-fns/locale'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useMemo } from 'react'
import type { InsertOrder, OrderWithItems } from '@/types'
import type { OrderFormState } from '../OrderForm'
import { useFetchCustomers } from '@/lib/queries/customers'
import { statusArray } from '@/lib/constants'
import { currencyArray } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import EntitySelect from '@/components/form/EntitySelect'
import InputField from '@/components/form/InputField'

type Props = {
  order?: OrderWithItems | null
  form: OrderFormState
  setForm: React.Dispatch<React.SetStateAction<OrderFormState>>
  formErrors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function OrderFormBasicInfo({
  order,
  form,
  setForm,
  formErrors,
  onChange,
}: Props) {
  const { data: customers = [] } = useFetchCustomers()

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        label: `${customer.code} - ${customer.name}`,
      })),
    [customers],
  )

  const currencyOptions = useMemo(
    () =>
      currencyArray.map((currency) => ({
        id: currency,
        label: currency,
      })),
    [],
  )

  const statusOptions = useMemo(
    () =>
      statusArray.map((status) => ({
        id: status,
        label: status,
      })),
    [],
  )

  return (
    <FieldSet>
      <FieldLegend>Temel Bilgiler</FieldLegend>
      <FieldSeparator />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FieldGroup className="gap-6">
          {/* Order Number */}
          {/* <Field>
            <FieldLabel>Sipariş No</FieldLabel>
            <Input
              name="order_number"
              value={form.order_number}
              onChange={onChange}
              placeholder="Örn: SIP-2024-001"
            />
            {formErrors.order_number && (
              <FieldError>{formErrors.order_number}</FieldError>
            )}
          </Field> */}

          <InputField
            name="order_number"
            label="Sipariş No"
            value={form.order_number}
            onChange={onChange}
            // required
            error={formErrors.order_number}
            placeholder="Örn: SIP-2024-001"
          />

          <EntitySelect
            name="customer_id"
            label="Müşteri"
            value={form.customer_id > 0 ? form.customer_id : null}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                customer_id: Number(value ?? 0),
              }))
            }
            options={customerOptions}
            placeholder="Müşteri seçin"
          />
          {formErrors.customer_id && (
            <FieldError>{formErrors.customer_id}</FieldError>
          )}

          <InputField
            name="delivery_address"
            label="Teslimat Adresi"
            value={form.delivery_address ?? ''}
            onChange={onChange}
            placeholder="Teslimat adresini girin"
          />
        </FieldGroup>

        <FieldGroup className="gap-6">
          <Field className="gap-1">
            <FieldLabel htmlFor="order_date">Sipariş Tarihi</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !form.order_date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.order_date ? (
                    format(form.order_date, 'dd MMMM yyyy', {
                      locale: tr,
                    })
                  ) : (
                    <span>Tarih seçin</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.order_date}
                  onSelect={(value) => {
                    if (!value) return
                    setForm((prev) => ({ ...prev, order_date: value }))
                  }}
                  className="rounded-md border"
                  captionLayout="label"
                  locale={tr}
                />
              </PopoverContent>
            </Popover>
            {formErrors.order_date && (
              <FieldError>{formErrors.order_date}</FieldError>
            )}
          </Field>

          <EntitySelect
            name="currency"
            label="Sipariş Para Birimi"
            value={form.currency ?? 'TRY'}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                currency: value as InsertOrder['currency'],
              }))
            }
            options={currencyOptions}
            placeholder="Para birimini seçin"
          />

          {order && (
            <EntitySelect
              name="status"
              label="Sipariş Durumu"
              value={form.status ?? 'KAYIT'}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as InsertOrder['status'],
                }))
              }
              options={statusOptions}
              placeholder="Sipariş durumunu seçin"
            />
          )}
        </FieldGroup>
      </div>
    </FieldSet>
  )
}
