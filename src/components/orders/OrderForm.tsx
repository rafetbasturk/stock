import { useCallback, useEffect } from 'react'
import { useLoaderData } from '@tanstack/react-router'
import { useOrderForm } from './order-form/hooks/useOrderForm'
import {
  OrderFormBasicInfo,
  OrderFormFooter,
  OrderFormHeader,
  OrderFormItems,
} from './order-form'
import type {
  Currency,
  InsertOrder,
  NewOrderItem,
  OrderListRow,
  OrderSubmitPayload,
  OrderWithItems,
} from '@/types'
import type { I18nErrorMessage } from '@/lib/error/core/errorTransport'
import type { FieldErrors } from '@/lib/error/utils/formErrors'
import { normalizeFieldErrors } from '@/lib/error/utils/formErrors'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'
import { useSelectProducts } from '@/hooks/useProducts'
import { convertCurrency } from '@/lib/currency'
import { useCreateOrderMutation, useUpdateOrderMutation } from '@/lib/mutations/orders'

export type OrderFormState = InsertOrder & {
  is_custom_order?: boolean
  items: Array<NewOrderItem & {
    id?: number
    tempId?: string
    unit_price_raw?: string
  }>
  customItems: Array<{
    id?: number
    name?: string
    unit?: string
    quantity?: number
    unit_price?: number
    currency?: Currency | null
    notes?: string | null
    tempId?: string
  }>
}

export type FormErrors = {
  get: (path: string) => I18nErrorMessage | undefined
  set: (path: string, message: I18nErrorMessage) => void
  clear: (path: string) => void
  has: (path: string) => boolean
}

export type SelectProduct = {
  id: number
  name: string
  code?: string
  price: number | null
  currency: string | null
}

interface BasePaginatedFormProps<TData, TSubmitPayload> {
  item?: TData
  isSubmitting: boolean
  onClose: () => void
  onSuccess: (payload: TSubmitPayload) => void
}

type OrderFormProps = BasePaginatedFormProps<OrderListRow, OrderSubmitPayload>

export default function OrderForm({
  item: order,
  onClose,
  onSuccess,
  isSubmitting,
}: OrderFormProps) {
  const { data: products = [], isLoading } = useSelectProducts()

  const lastOrderNumber = useLoaderData({ from: '/orders' })

  const rates = useExchangeRatesStore.use.rates()

  const {
    form,
    setForm,
    formErrors,
    setFormErrors,
    errorHelpers,
    handleChange,
    addItem,
    removeItem,
    prevCurrency,
    setPrevCurrency,
    validateForm,
    toggleCustomMode,
  } = useOrderForm({ order })

  const mutationFormErrors = {
    setAllErrors: (next: FieldErrors) =>
      setFormErrors(normalizeFieldErrors(next)),
    resetErrors: () => setFormErrors({}),
  }

  const createMutation = useCreateOrderMutation(onSuccess, mutationFormErrors)
  const updateMutation = useUpdateOrderMutation(onSuccess, mutationFormErrors)

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (lastOrderNumber && !order?.id) {
      const numeric = Number(lastOrderNumber)
      const next =
        Number.isFinite(numeric) && numeric > 0
          ? String(numeric + 1)
          : String(lastOrderNumber)

      setForm((prev) => {
        if (prev.order_number.trim().length) return prev
        return {
          ...prev,
          order_number: next,
        }
      })
    }
  }, [lastOrderNumber, order?.id, setForm])

  useEffect(() => {
    if (form.currency !== prevCurrency && rates.length > 0) {
      const fromCurrency = prevCurrency
      const toCurrency = form.currency || 'TRY'

      setForm((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.product_id && products.length > 0) {
            const product = products.find((p) => p.id === item.product_id)
            if (product) {
              const convertedPrice = convertCurrency(
                product.price ?? 0,
                (product.currency as Currency) || 'TRY',
                toCurrency,
                rates,
              )
              return {
                ...item,
                unit_price: convertedPrice,
                currency: toCurrency,
              }
            }
          }

          const convertedPrice = convertCurrency(
            item.unit_price,
            fromCurrency,
            toCurrency,
            rates,
          )

          return {
            ...item,
            unit_price: convertedPrice,
            currency: toCurrency,
          }
        }),
        customItems: prev.customItems.map((ci) => ({
          ...ci,
          unit_price: convertCurrency(
            ci.unit_price ?? 0,
            fromCurrency,
            toCurrency,
            rates,
          ),
          currency: toCurrency,
        })),
      }))

      setPrevCurrency(toCurrency)
    }
  }, [
    form.currency,
    prevCurrency,
    rates,
    products,
    setForm,
    setPrevCurrency,
  ])

  const handleItemChange = useCallback(
    (idx: number, field: keyof NewOrderItem, value: any) => {
      setForm((prev) => {
        const newItems = [...prev.items]
        newItems[idx] = { ...newItems[idx], [field]: value }

        if (field === 'product_id') {
          const product = products.find((p) => p.id === Number(value))
          if (product) {
            const converted = convertCurrency(
              product.price ?? 0,
              (product.currency as Currency) || 'TRY',
              form.currency || 'TRY',
              rates,
            )
            newItems[idx].unit_price = converted
            newItems[idx].currency = form.currency || 'TRY'
          }
        }

        return { ...prev, items: newItems }
      })

      errorHelpers.clear(`items[${idx}].${field}`)
    },
    [products, form.currency, rates, setForm, errorHelpers],
  )

  const addCustomItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      customItems: [
        ...prev.customItems,
        {
          tempId: crypto.randomUUID(),
          name: '',
          unit: 'adet',
          quantity: 1,
          unit_price: 0,
          currency: prev.currency ?? 'TRY',
          notes: '',
        },
      ],
    }))
  }, [setForm])

  const removeCustomItem = useCallback(
    (idx: number) => {
      setForm((prev) => ({
        ...prev,
        customItems: prev.customItems.filter((_, i) => i !== idx),
      }))
    },
    [setForm],
  )

  const handleCustomItemChange = useCallback(
    (
      idx: number,
      field: keyof OrderFormState['customItems'][0],
      value: any,
    ) => {
      setForm((prev) => {
        const newCustomItems = [...prev.customItems]
        newCustomItems[idx] = { ...newCustomItems[idx], [field]: value }
        return { ...prev, customItems: newCustomItems }
      })
      errorHelpers.clear(`customItems[${idx}].${field}`)
    },
    [setForm, errorHelpers],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const payload: OrderSubmitPayload = {
      ...form,
      items: form.is_custom_order
        ? []
        : form.items
            .filter((i) => i.product_id > 0)
            .map((i) => ({
              id: i.id,
              product_id: Number(i.product_id),
              unit_price: i.unit_price,
              quantity: i.quantity ?? 0,
              currency: form.currency,
            })),
      customItems: form.is_custom_order
        ? form.customItems.map((i) => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
            quantity: i.quantity,
            unit_price: i.unit_price,
            currency: form.currency,
            notes: i.notes ?? '',
          }))
        : [],
    }

    if (order?.id) {
      updateMutation.mutate({ id: order.id, data: payload })
      return
    }

    createMutation.mutate(payload)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-360 h-[min(94vh,60rem)] overflow-y-auto p-3 md:p-6">
        <OrderFormHeader orderId={order?.id} isSubmitting={submitting} />

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <OrderFormBasicInfo
            order={order as OrderWithItems | undefined}
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            clearFieldError={errorHelpers.clear}
            onChange={handleChange}
          />

          <OrderFormItems
            form={form}
            errorHelpers={errorHelpers}
            products={products}
            isLoading={isLoading}
            toggleCustomMode={toggleCustomMode}
            onItemChange={handleItemChange}
            removeItem={removeItem}
            addItem={addItem}
            onCustomItemChange={handleCustomItemChange}
            removeCustomItem={removeCustomItem}
            addCustomItem={addCustomItem}
          />

          <OrderFormFooter
            orderId={order?.id}
            isSubmitting={submitting}
            onClose={onClose}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
