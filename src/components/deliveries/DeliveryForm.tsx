// src/components/deliveries/DeliveryForm.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  DeliveryFormBasicInfo,
  DeliveryFormFooter,
  DeliveryFormHeader,
  DeliveryFormItems,
} from './delivery-form'

import type {
  DeliveryListRow,
  Currency,
  Status,
  DeliveryWithItems,
} from '@/types'
import {
  useCreateDeliveryMutation,
  useUpdateDeliveryMutation,
} from '@/lib/mutations/deliveries'
import type { FieldErrors } from '@/lib/error/utils/formErrors'

function incrementDeliveryNumber(num: string) {
  const match = num.match(/(\d+)$/)
  if (!match) return num + '000001'

  const prefix = num.slice(0, match.index)
  const digits = match[1] ?? ''
  const nextNumber = String(Number(digits) + 1).padStart(digits.length, '0')

  return prefix + nextNumber
}

export interface ProductMinimal {
  code: string
  name: string
  unit: string
}

export interface NormalOrderItem {
  id: number
  quantity: number
  unit_price: number
  product: ProductMinimal
  currency?: Currency
  deliveries: any[]
}

export interface CustomOrderItem {
  id: number
  quantity: number
  unit_price: number
  custom_code?: string
  custom_name?: string
  unit?: string | null
  currency?: Currency
  deliveries: any[]
}

export interface OrderMinimal {
  id: number
  customer_id: number
  order_number: string
  items?: NormalOrderItem[]
  customItems?: CustomOrderItem[]
  status: Status | string // check later - added string to prevent types mismatch
  order_date?: Date
  items_count?: number
}

export interface DeliveryItem {
  id?: number

  order_id?: number
  order_item_id?: number
  custom_order_item_id?: number

  delivered_quantity: number
  remaining_quantity: number

  product_code?: string
  product_name?: string
  unit?: string
  order_quantity?: number
  price?: number
  total_price?: number
  currency?: Currency
}

interface DeliveryFormState {
  customer_id: number | ''
  delivery_number: string
  delivery_date: Date | null
  notes: string
  items: DeliveryItem[]
}

const emptyItem: DeliveryItem = {
  delivered_quantity: 1,
  remaining_quantity: 0,
  order_id: undefined,
  order_item_id: undefined,
  custom_order_item_id: undefined,
  product_code: '',
  product_name: '',
  unit: '',
  currency: 'TRY',
}

const formInitials: DeliveryFormState = {
  customer_id: '',
  delivery_number: '',
  delivery_date: new Date(),
  notes: '',
  items: [structuredClone(emptyItem)],
}

function normalizeDeliveryItems(items?: any[]): DeliveryItem[] {
  if (!items?.length) return [structuredClone(emptyItem)]

  return items.map((i) => {
    const oi = i.orderItem
    const ci = i.customOrderItem
    const delivered = i.delivered_quantity ?? 1

    // --------------------- NORMAL PRODUCT ----------------------
    if (oi) {
      const totalSent =
        oi.deliveries?.reduce(
          (sum: number, d: any) => sum + (d.delivered_quantity ?? 0),
          0,
        ) ?? 0

      const remaining = Math.max(oi.quantity - totalSent + delivered, 0)

      return {
        id: i.id,
        order_id: oi.order_id,
        order_item_id: oi.id,

        delivered_quantity: delivered,
        remaining_quantity: remaining,

        product_code: oi.product?.code ?? '',
        product_name: oi.product?.name ?? '',
        unit: oi.product?.unit ?? '',

        order_quantity: oi.quantity,
        price: oi.unit_price,
        currency: oi.currency,
        total_price: delivered * (oi.unit_price ?? 0),
      }
    }

    // --------------------- CUSTOM PRODUCT ----------------------
    if (ci) {
      const totalSent =
        ci.deliveries?.reduce(
          (sum: number, d: any) => sum + (d.delivered_quantity ?? 0),
          0,
        ) ?? 0

      return {
        id: i.id,
        order_id: ci.order_id,
        custom_order_item_id: ci.id,
        delivered_quantity: delivered,
        remaining_quantity: Math.max(ci.quantity - totalSent + delivered, 0),

        product_code: ci.name,
        product_name: ci.name,
        unit: ci.unit ?? 'adet',

        order_quantity: ci.quantity,
        price: ci.unit_price,
        currency: ci.currency,
        total_price: delivered * (ci.unit_price ?? 0),
      }
    }

    return structuredClone(emptyItem)
  })
}

interface DeliveryFormProps {
  item?: DeliveryListRow | DeliveryWithItems
  orders: OrderMinimal[]
  lastDeliveryNumber?: string
  onClose: () => void
}

export function DeliveryForm({
  item: delivery,
  orders,
  lastDeliveryNumber = '',
  onClose,
}: DeliveryFormProps) {
  const [form, setForm] = useState<DeliveryFormState>(formInitials)
  const [errors, setErrors] = useState<FieldErrors>({})

  function validateForm() {
    const newErrors: FieldErrors = {}

    if (!form.customer_id) {
      newErrors.customer_id = { i18n: { ns: 'validation', key: 'required' } }
    }
    if (!form.delivery_number.trim())
      newErrors.delivery_number = {
        i18n: { ns: 'validation', key: 'required' },
      }

    if (form.items.length === 0)
      newErrors.items = {
        i18n: { ns: 'validation', key: 'at_least_one_item' },
      }

    // 🔥 Mixed currency validation
    const currencies = new Set(
      form.items
        .filter((i) => i.delivered_quantity > 0)
        .map((i) => i.currency)
        .filter(Boolean),
    )

    if (currencies.size > 1) {
      newErrors.items = {
        i18n: { ns: 'validation', key: 'mixed_currency_not_allowed' },
      }
    }

    // 🚫 Prevent over-delivery (only for rows with selected item)
    const qtyError = form.items.some(
      (i) =>
        (i.order_item_id || i.custom_order_item_id) &&
        i.delivered_quantity > (i.remaining_quantity ?? Infinity),
    )

    if (qtyError) {
      newErrors.items = {
        i18n: { ns: 'validation', key: 'delivery_quantity_exceeds_remaining' },
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const filteredOrders = useMemo(() => {
    if (delivery) {
      return orders
    } else {
      return orders.filter((o) => !['BİTTİ', 'İPTAL'].includes(o.status))
    }
  }, [delivery, orders])

  // Unique customer list
  const customerIdsFromOrders = useMemo(() => {
    const ids = new Set<number>()
    filteredOrders.forEach((o) => ids.add(o.customer_id))
    return [...ids]
  }, [filteredOrders])

  // Filter orders belonging to selected customer
  const customerOrders = useMemo(() => {
    if (!form.customer_id) return []

    // get normal allowed orders (open ones)
    return filteredOrders.filter((o) => o.customer_id === form.customer_id)
  }, [form.customer_id, filteredOrders])

  const createMutation = useCreateDeliveryMutation(onClose)
  const updateMutation = useUpdateDeliveryMutation(onClose)

  const submitting = createMutation.isPending || updateMutation.isPending

  // --------------------------------------------
  // BASIC FIELD CHANGE
  // --------------------------------------------
  const handleChange = (field: string, value: any) => {
    setErrors((prev) => {
      if (!prev[field]) return prev // nothing to clear
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // --------------------------------------------
  // ADD ROW
  // --------------------------------------------
  const addItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, structuredClone(emptyItem)],
    }))
  }, [])

  // --------------------------------------------
  // REMOVE ROW
  // --------------------------------------------
  const removeItem = useCallback((idx: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }))
  }, [])

  // --------------------------------------------
  // ITEM CHANGE
  // --------------------------------------------
  const handleItemChange = useCallback(
    (idx: number, field: string, value: any) => {
      setErrors((prev) => {
        const key = `items.${idx}.${field}`
        if (!prev[key]) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })

      setForm((prev) => {
        const items = [...prev.items]
        const current = items[idx]
        if (!current) return prev

        const updated: DeliveryItem = {
          ...current,
          delivered_quantity: current.delivered_quantity ?? 1,
        }

        /* ────────────────────────────────
          1) ORDER SELECTED → Reset row + preload first product
         ──────────────────────────────── */
        if (field === 'order_id') {
          updated.order_id = value
          updated.order_item_id = undefined
          updated.custom_order_item_id = undefined

          updated.product_code = ''
          updated.product_name = ''
          updated.unit = ''

          updated.order_quantity = undefined
          updated.price = undefined
          updated.total_price = undefined
          updated.remaining_quantity = 0

          /* Auto populate first order item */
          const selectedOrder = orders.find((o) => o.id === value)
          const first =
            selectedOrder?.items?.[0] ?? selectedOrder?.customItems?.[0]

          if (first) {
            updated.order_item_id = first.id

            const deliveries = first.deliveries ?? []
            const totalDelivered = deliveries.reduce(
              (sum: number, d: any) => sum + (d.delivered_quantity || 0),
              0,
            )

            updated.remaining_quantity = Math.max(
              first.quantity - totalDelivered,
              0,
            )

            updated.order_quantity = first.quantity
            updated.price = first.unit_price
            updated.currency = first.currency
            updated.delivered_quantity = 1

            if ('product' in first) {
              updated.product_code = first.product.code
              updated.product_name = first.product.name
              updated.unit = first.product.unit
            } else {
              updated.product_code = first.custom_code ?? first.custom_name
              updated.product_name = first.custom_name ?? 'Özel Ürün'
              updated.unit = first.unit ?? 'adet'
            }

            updated.total_price = updated.price * updated.delivered_quantity
          }

          items[idx] = updated
          return { ...prev, items }
        }

        /* ────────────────────────────────
          2) PRODUCT SELECTED
         ──────────────────────────────── */
        if (field === 'order_item_id') {
          updated.order_item_id = value

          const order = orders.find((o) => o.id === updated.order_id)
          const normal = order?.items?.find((i) => i.id === value)
          const custom = order?.customItems?.find((i) => i.id === value)
          const itemObj = normal ?? custom

          if (itemObj) {
            const deliveries = itemObj.deliveries ?? []
            const totalSent = deliveries.reduce(
              (sum: number, d: any) => sum + (d.delivered_quantity || 0),
              0,
            )

            updated.remaining_quantity = Math.max(
              itemObj.quantity - totalSent,
              0,
            )

            if ('product' in itemObj) {
              updated.product_code = itemObj.product.code
              updated.product_name = itemObj.product.name
              updated.unit = itemObj.product.unit
            } else {
              updated.product_code = itemObj.custom_code ?? itemObj.custom_name
              updated.product_name = itemObj.custom_name ?? 'Özel Ürün'
              updated.unit = itemObj.unit ?? 'adet'
            }

            updated.order_quantity = itemObj.quantity
            updated.price = itemObj.unit_price
            updated.currency = itemObj.currency
            updated.total_price =
              updated.delivered_quantity * (itemObj.unit_price ?? 0)
          }

          items[idx] = updated
          return { ...prev, items }
        }

        /* ────────────────────────────────
          3) DELIVERED QTY EDIT
         ──────────────────────────────── */
        if (field === 'delivered_quantity') {
          const max = current.remaining_quantity ?? Infinity
          const qty = Math.max(0, Number(value) || 0)

          updated.delivered_quantity = Math.min(qty, max)
          updated.total_price =
            updated.delivered_quantity * (updated.price ?? 0)

          items[idx] = updated
          return { ...prev, items }
        }

        return prev
      })
    },
    [orders],
  )

  // --------------------------------------------
  // EDIT MODE
  // --------------------------------------------
  useEffect(() => {
    if (delivery) {
      setForm({
        customer_id: delivery.customer_id,
        delivery_number: delivery.delivery_number ?? '',
        delivery_date: delivery.delivery_date
          ? new Date(delivery.delivery_date)
          : new Date(),
        notes: delivery.notes ?? '',
        items: normalizeDeliveryItems(delivery.items),
      })
    } else {
      setForm({
        ...formInitials,
        delivery_number: incrementDeliveryNumber(lastDeliveryNumber),
      })
    }
  }, [delivery, lastDeliveryNumber, orders])

  // --------------------------------------------
  // SUBMIT
  // --------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const payload: any = {
      id: delivery?.id,
      customer_id: Number(form.customer_id),
      delivery_number: form.delivery_number.trim(),
      delivery_date: form.delivery_date ?? new Date(),
      notes: form.notes,
      items: form.items.map((i) => ({
        id: i.id,
        order_item_id: i.order_item_id ?? undefined,
        custom_order_item_id: i.custom_order_item_id ?? undefined,
        delivered_quantity: i.delivered_quantity,
      })),
    }

    if (delivery?.id) {
      updateMutation.mutate({ id: delivery.id, data: payload })
      return
    }

    createMutation.mutate(payload)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="m-6 p-6 w-full lg:max-w-7xl max-h-[92vh] overflow-hidden flex flex-col gap-0 border-none bg-background shadow-2xl">
        {/* Inner scroll area controls vertical scroll */}

        <DeliveryFormHeader
          deliveryId={delivery?.id}
          isSubmitting={submitting}
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DeliveryFormBasicInfo
            form={form}
            onChange={handleChange}
            customerIds={customerIdsFromOrders}
            errors={errors}
          />

          <div className="h-full max-h-60 overflow-y-auto">
            <DeliveryFormItems
              items={form.items}
              orders={customerOrders}
              onItemChange={handleItemChange}
              removeItem={removeItem}
              addItem={addItem}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <DeliveryFormFooter
            deliveryId={delivery?.id}
            isSubmitting={createMutation.isPending}
            onClose={onClose}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
