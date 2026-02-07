import { tr } from 'date-fns/locale'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { InsertOrder, OrderWithItems } from '@/types'
import type { OrderFormState } from '../OrderForm'
import type { FieldErrors } from '@/lib/error/utils/formErrors'
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
  formErrors: FieldErrors
  clearFieldError: (path: string) => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function OrderFormBasicInfo({
  order,
  form,
  setForm,
  formErrors,
  clearFieldError,
  onChange,
}: Props) {
  const { t } = useTranslation('orders')
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
      <FieldLegend>{t('form.sections.basic')}</FieldLegend>
      <FieldSeparator />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FieldGroup className="gap-6">
          <InputField
            name="order_number"
            label={t('form.fields.order_number')}
            value={form.order_number}
            onChange={onChange}
            required
            error={formErrors.order_number}
            placeholder={t('form.placeholders.order_number')}
          />

          <EntitySelect
            name="customer_id"
            label={t('form.fields.customer')}
            value={form.customer_id > 0 ? form.customer_id : null}
            error={formErrors.customer_id}
            onValueChange={(value) =>
              {
                setForm((prev) => ({
                  ...prev,
                  customer_id: Number(value ?? 0),
                }))
                clearFieldError('customer_id')
              }
            }
            options={customerOptions}
            placeholder={t('form.placeholders.customer')}
          />

          <InputField
            name="delivery_address"
            label={t('form.fields.delivery_address')}
            value={form.delivery_address ?? ''}
            onChange={onChange}
            placeholder={t('form.placeholders.delivery_address')}
          />
        </FieldGroup>

        <FieldGroup className="gap-6">
          <Field className="gap-1">
            <FieldLabel htmlFor="order_date">
              {t('form.fields.order_date')}
            </FieldLabel>
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
                    <span>{t('form.placeholders.order_date')}</span>
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
                    clearFieldError('order_date')
                  }}
                  className="rounded-md border"
                  captionLayout="label"
                  locale={tr}
                />
              </PopoverContent>
            </Popover>
            {formErrors.order_date && (
              <FieldError>
                {t(
                  `${formErrors.order_date.i18n.ns}:${formErrors.order_date.i18n.key}`,
                  formErrors.order_date.params,
                )}
              </FieldError>
            )}
          </Field>

          <EntitySelect
            name="currency"
            label={t('form.fields.currency')}
            value={form.currency ?? 'TRY'}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                currency: value as InsertOrder['currency'],
              }))
            }
            options={currencyOptions}
            placeholder={t('form.placeholders.currency')}
          />

          {order && (
            <EntitySelect
              name="status"
              label={t('form.fields.status')}
              value={form.status ?? 'KAYIT'}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as InsertOrder['status'],
                }))
              }
              options={statusOptions}
              placeholder={t('form.placeholders.status')}
            />
          )}
        </FieldGroup>
      </div>
    </FieldSet>
  )
}
