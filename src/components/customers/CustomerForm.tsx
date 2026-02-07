import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FormEvent } from 'react'
import type { FieldErrors } from '@/lib/error/utils/formErrors'
import type { Customer, InsertCustomer } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import InputField from '@/components/form/InputField'
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '@/lib/mutations/customers'

type CustomerFormValues = {
  code: string
  name: string
  email: string
  phone: string
  address: string
}

interface CustomerFormProps {
  item?: Customer
  isSubmitting: boolean
  onClose: () => void
  onSuccess: () => void
}

function toFormValues(item?: Customer): CustomerFormValues {
  return {
    code: item?.code ?? '',
    name: item?.name ?? '',
    email: item?.email ?? '',
    phone: item?.phone ?? '',
    address: item?.address ?? '',
  }
}

function toPayload(values: CustomerFormValues): InsertCustomer {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    address: values.address.trim() || null,
  }
}

export default function CustomerForm({
  item,
  isSubmitting: isSubmittingProp,
  onClose,
  onSuccess,
}: CustomerFormProps) {
  const { t } = useTranslation()
  const [values, setValues] = useState<CustomerFormValues>(() => toFormValues(item))
  const [formErrors, setFormErrors] = useState<FieldErrors>({})

  const createMutation = useCreateCustomerMutation(onSuccess, {
    setAllErrors: setFormErrors,
    resetErrors: () => setFormErrors({}),
  })

  const updateMutation = useUpdateCustomerMutation(onSuccess, {
    setAllErrors: setFormErrors,
    resetErrors: () => setFormErrors({}),
  })

  const isSubmitting =
    isSubmittingProp || createMutation.isPending || updateMutation.isPending

  const hasChanged = useMemo(() => {
    if (!item) {
      return Object.values(values).some((value) => value.trim().length > 0)
    }

    const initial = toFormValues(item)
    return (
      initial.code !== values.code ||
      initial.name !== values.name ||
      initial.email !== values.email ||
      initial.phone !== values.phone ||
      initial.address !== values.address
    )
  }, [item, values])

  const setValue = (field: keyof CustomerFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => {
      if (!prev[field] && !prev._form) return prev
      return {
        ...prev,
        [field]: undefined,
        _form: undefined,
      }
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FieldErrors = {}

    if (!values.code.trim()) {
      nextErrors.code = {
        i18n: {
          ns: 'validation',
          key: 'required',
        },
      }
    }

    if (!values.name.trim()) {
      nextErrors.name = {
        i18n: {
          ns: 'validation',
          key: 'required',
        },
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    const payload = toPayload(values)

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload })
      return
    }

    createMutation.mutate(payload)
  }

  const title = item ? 'Müşteri Düzenle' : 'Yeni Müşteri'
  const description = item
    ? 'Müşteri bilgilerini güncelleyebilirsiniz.'
    : 'Yeni müşteri bilgilerini girin.'

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              name="code"
              label="Müşteri Kodu"
              value={values.code}
              onChange={(e) => setValue('code', e.target.value)}
              required
              disabled={isSubmitting}
              error={formErrors.code}
            />
            <InputField
              name="name"
              label="Müşteri Adı"
              value={values.name}
              onChange={(e) => setValue('name', e.target.value)}
              required
              disabled={isSubmitting}
              error={formErrors.name}
            />
            <InputField
              name="email"
              label="Email"
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              type="email"
              disabled={isSubmitting}
              error={formErrors.email}
            />
            <InputField
              name="phone"
              label="Telefon"
              value={values.phone}
              onChange={(e) => setValue('phone', e.target.value)}
              disabled={isSubmitting}
              error={formErrors.phone}
            />
          </div>

          <InputField
            name="address"
            label="Adres"
            value={values.address}
            onChange={(e) => setValue('address', e.target.value)}
            disabled={isSubmitting}
            error={formErrors.address}
          />

          {formErrors._form && (
            <p className="text-sm text-destructive">
              {t(`${formErrors._form.i18n.ns}:${formErrors._form.i18n.key}`, formErrors._form.params)}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasChanged}>
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
