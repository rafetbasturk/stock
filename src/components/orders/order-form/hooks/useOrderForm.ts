import { useCallback, useMemo, useState } from 'react'
import type { Currency, OrderWithItems, Status } from '@/types'
import type { FormErrors, OrderFormState } from '../../OrderForm'
import type { I18nErrorMessage } from '@/lib/error/core/errorTransport'
import type { FieldErrors } from '@/lib/error/utils/formErrors'
import { normalizeFieldPath } from '@/lib/error/utils/formErrors'

type UseOrderFormArgs = {
  order?: OrderWithItems
}

function defaultItem(currency: Currency) {
  return {
    product_id: 0,
    quantity: 1,
    unit_price: 0,
    currency,
  }
}

function defaultCustomItem(currency: Currency) {
  return {
    name: '',
    unit: 'adet',
    quantity: 1,
    unit_price: 0,
    currency,
    notes: '',
  }
}

function toInitialForm(order?: OrderWithItems): OrderFormState {
  const currency = (order?.currency as Currency) ?? 'TRY'
  const isCustom = Boolean(order?.is_custom_order)

  const items =
    order?.items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency: (item.currency as Currency) ?? currency,
    })) ?? []

  const customItems =
    order?.customItems.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit ?? 'adet',
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency: item.currency ?? currency,
      notes: item.notes ?? '',
    })) ?? []

  return {
    is_custom_order: isCustom,
    order_number: order?.order_number ?? '',
    order_date: order?.order_date ? new Date(order.order_date) : new Date(),
    customer_id: order?.customer_id ?? 0,
    status: order ? (order.status as Status) : 'KAYIT',
    currency,
    delivery_address: order?.delivery_address ?? null,
    notes: order?.notes ?? null,
    items: isCustom ? [] : items.length > 0 ? items : [defaultItem(currency)],
    customItems: isCustom
      ? customItems.length > 0
        ? customItems
        : [defaultCustomItem(currency)]
      : customItems,
  }
}

export function useOrderForm({ order }: UseOrderFormArgs) {
  const [form, setForm] = useState<OrderFormState>(() => toInitialForm(order))
  const [formErrors, setFormErrors] = useState<FieldErrors>({})
  const [prevCurrency, setPrevCurrency] = useState<Currency>(
    (order?.currency as Currency) ?? 'TRY',
  )

  const requiredError: I18nErrorMessage = {
    i18n: { ns: 'validation', key: 'required' },
  }
  const invalidError: I18nErrorMessage = {
    i18n: { ns: 'validation', key: 'invalid' },
  }

  const errorHelpers: FormErrors = useMemo(
    () => ({
      get: (path) => formErrors[normalizeFieldPath(path)],
      set: (path, message) => {
        const normalizedPath = normalizeFieldPath(path)
        setFormErrors((prev) => ({ ...prev, [normalizedPath]: message }))
      },
      clear: (path) => {
        const normalizedPath = normalizeFieldPath(path)
        setFormErrors((prev) => {
          if (!prev[normalizedPath]) return prev
          const next = { ...prev }
          delete next[normalizedPath]
          return next
        })
      },
      has: (path) => Boolean(formErrors[normalizeFieldPath(path)]),
    }),
    [formErrors],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target

      setForm((prev) => ({
        ...prev,
        [name]: name === 'order_number' ? value : value || null,
      }))

      errorHelpers.clear(name)
    },
    [errorHelpers],
  )

  const addItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, defaultItem((prev.currency as Currency) ?? 'TRY')],
    }))
  }, [])

  const removeItem = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }, [])

  const handleCustomerChange = useCallback((id: number | null) => {
    setForm((prev) => ({
      ...prev,
      customer_id: id ?? 0,
    }))
  }, [])

  const toggleCustomMode = useCallback((checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      is_custom_order: checked,
      items: checked ? [] : prev.items.length ? prev.items : [defaultItem((prev.currency as Currency) ?? 'TRY')],
      customItems: checked
        ? prev.customItems.length
          ? prev.customItems
          : [defaultCustomItem((prev.currency as Currency) ?? 'TRY')]
        : prev.customItems,
    }))
    setFormErrors({})
  }, [])

  const validateForm = useCallback(() => {
    const nextErrors: FieldErrors = {}

    if (!form.order_number.trim()) {
      nextErrors.order_number = requiredError
    }

    if (!form.customer_id || form.customer_id <= 0) {
      nextErrors.customer_id = requiredError
    }

    if (!form.order_date) {
      nextErrors.order_date = requiredError
    }

    if (form.is_custom_order) {
      if (!form.customItems.length) {
        nextErrors.customItems = invalidError
      }
      form.customItems.forEach((item, index) => {
        if (!item.name?.trim()) {
          nextErrors[`customItems[${index}].name`] = requiredError
        }
      })
    } else {
      if (!form.items.length) {
        nextErrors.items = invalidError
      }
      form.items.forEach((item, index) => {
        if (!item.product_id || item.product_id <= 0) {
          nextErrors[`items[${index}].product_id`] = requiredError
        }
      })
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [form, invalidError, requiredError])

  return {
    form,
    setForm,
    formErrors,
    setFormErrors,
    errorHelpers,
    handleChange,
    addItem,
    removeItem,
    handleCustomerChange,
    prevCurrency,
    setPrevCurrency,
    validateForm,
    toggleCustomMode,
  }
}
