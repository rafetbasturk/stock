import { and, eq, isNull, sql } from 'drizzle-orm'
import type {
  Currency,
  DeliveryListRow,
  DeliveryWithItems,
  InsertCustomer,
  InsertProduct,
  OrderWithItems,
} from '@/types'
import {
  customOrderItemsTable,
  deliveryItemsTable,
  orderItemsTable,
  ordersTable,
} from '@/db/schema'
import { TR } from '@/lib/constants'
import { failValidation } from '@/lib/error/core/serverError'

export function normalizeText(input?: string | null) {
  const s = (input ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-') // "1050 - CK45" -> "1050-CK45"

  return s.length ? s : null
}

export function normalizeCode(input?: string | null) {
  const s = normalizeText(input)
  if (!s) return null

  // If codes shouldn't contain spaces, remove them; keep hyphens
  return s.replace(/\s+/g, '').toLocaleUpperCase(TR)
}

export function normalizeMaterial(input?: string | null) {
  const s = normalizeText(input)
  return s ? s.toLocaleUpperCase(TR) : null
}

export function normalizeProcess(input?: string | null) {
  const s = normalizeText(input)
  return s ? s.toLocaleUpperCase(TR) : null
}

export const validateProduct = (product: InsertProduct) => {
  if (!product.code.trim()) {
    failValidation({
      code: { i18n: { ns: 'validation', key: 'required' } },
    })
  }
  if (!product.name.trim()) {
    failValidation({
      name: { i18n: { ns: 'validation', key: 'required' } },
    })
  }
  if (product.customer_id <= 0) {
    failValidation({
      customer_id: { i18n: { ns: 'validation', key: 'invalid' } },
    })
  }
}

export const editProductBeforeInsert = (product: InsertProduct) => {
  const code = normalizeCode(product.code)
  if (code) product.code = code

  const name = normalizeText(product.name)
  if (name) {
    // keep your “capitalize first letter” behavior, but TR-locale safe
    product.name = name[0].toLocaleUpperCase(TR) + name.slice(1)
  }

  // Normalize common text columns (prevents trailing/duplicate whitespace variants)
  if (product.other_codes != null)
    product.other_codes = normalizeText(product.other_codes)
  if (product.notes != null) product.notes = normalizeText(product.notes)

  // Critical: normalize material so the DB doesn’t store duplicates
  if (product.material != null)
    product.material = normalizeMaterial(product.material)

  // Optional: normalize these too if you plan to filter/group by them
  if (product.coating != null) product.coating = normalizeText(product.coating)
  if (product.post_process != null)
    product.post_process = normalizeProcess(product.post_process)
  if (product.specs != null) product.specs = normalizeText(product.specs)
  if (product.specs_net != null)
    product.specs_net = normalizeText(product.specs_net)
}

export function addTotalAmount<T extends OrderWithItems | DeliveryWithItems>(
  data: T,
): T & { total_amount: number } {
  let totalCents = 0

  // ---- Case 1: Order object ----
  if ('is_custom_order' in data) {
    const sourceItems = data.is_custom_order
      ? data.customItems
      : data.items

    totalCents = sourceItems.reduce((sum, item) => {
      const price = item.unit_price // already cents
      const qty = item.quantity
      return sum + price * qty
    }, 0)
  }

  // ---- Case 2: Delivery object ----
  if ('delivery_number' in data) {
    const sign = data.kind === 'RETURN' ? -1 : 1
    totalCents = data.items.reduce((sum, item) => {
      const price =
        item.orderItem?.unit_price ?? item.customOrderItem?.unit_price ?? 0 // cents
      const qty = item.delivered_quantity
      return sum + sign * price * qty
    }, 0)
  }

  // convert to "normal" number with 2 decimal places
  const total_amount = Number((totalCents / 100).toFixed(2))

  return { ...data, total_amount }
}

export function addDeliveryTotals(
  delivery: DeliveryWithItems,
): DeliveryListRow {
  const sign = delivery.kind === 'RETURN' ? -1 : 1

  // 1) Sum in cents to avoid floating-point issues
  const totalCents = delivery.items.reduce((sum, item) => {
    const price =
      item.orderItem?.unit_price ?? item.customOrderItem?.unit_price ?? 0 // cents
    const qty = item.delivered_quantity
    return sum + sign * price * qty
  }, 0)

  // 2) Derive currency from the first item
  //    Business rule: a delivery can't mix currencies (enforced in the form).
  const firstItem = delivery.items.at(0)

  const currency = (firstItem?.orderItem?.currency ??
    firstItem?.customOrderItem?.currency ??
    'TRY') as Currency

  // 3) Convert back to "normal" amount with 2 decimals
  const total_amount = Number((totalCents / 100).toFixed(2))

  return {
    ...delivery,
    total_amount,
    currency,
  }
}

export const notDeleted = (table: { deleted_at: any }) =>
  isNull(table.deleted_at)

export const normalizeDateForDB = (value: any): Date => {
  let normalizedDate: Date
  if (value instanceof Date) {
    normalizedDate = value
  } else if (typeof value === 'string' || typeof value === 'number') {
    normalizedDate = new Date(value)
  } else {
    throw Error('normalize date')
    // throw new AppError(
    //   400,
    //   'VALIDATION_ERROR',
    //   'en',
    //   'Invalid delivery_date value',
    // )
  }
  return normalizedDate
}

export async function updateOrderStatusIfComplete(tx: any, orderId: number) {
  // 1. Get order type
  const order = await tx.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
    columns: { is_custom_order: true },
  })

  let allShipped = true
  let hasItems = false

  if (order?.is_custom_order) {
    const customItems = await tx.query.customOrderItemsTable.findMany({
      where: and(
        eq(customOrderItemsTable.order_id, orderId),
        isNull(customOrderItemsTable.deleted_at),
      ),
      with: {
        deliveries: {
          where: isNull(deliveryItemsTable.deleted_at),
          with: {
            delivery: {
              columns: {
                kind: true,
              },
            },
          },
        },
      },
    })
    hasItems = customItems.length > 0
    for (const item of customItems) {
      const deliveredTotal = (item.deliveries ?? []).reduce(
        (sum: number, di: any) =>
          sum +
          ((di.delivery?.kind === 'RETURN' ? -1 : 1) *
            (di.delivered_quantity ?? 0)),
        0,
      )
      if (deliveredTotal < item.quantity) {
        allShipped = false
        break
      }
    }
  } else {
    const items = await tx.query.orderItemsTable.findMany({
      where: and(
        eq(orderItemsTable.order_id, orderId),
        isNull(orderItemsTable.deleted_at),
      ),
      with: {
        deliveries: {
          where: isNull(deliveryItemsTable.deleted_at),
          with: {
            delivery: {
              columns: {
                kind: true,
              },
            },
          },
        },
      },
    })
    hasItems = items.length > 0
    for (const item of items) {
      const deliveredTotal = (item.deliveries ?? []).reduce(
        (sum: number, di: any) =>
          sum +
          ((di.delivery?.kind === 'RETURN' ? -1 : 1) *
            (di.delivered_quantity ?? 0)),
        0,
      )
      if (deliveredTotal < item.quantity) {
        allShipped = false
        break
      }
    }
  }

  // If order has no active items (e.g. all deleted), we might want to stay in 'ÜRETİM' or similar,
  // but 'BİTTİ' (COMPLETED) is a reasonable fallback if nothing is left to ship.
  // Actually, if it has no items, it shouldn't probably be 'BİTTİ' if it was just created.
  // But usually, an order without items is an invalid state or cancelled.

  await tx
    .update(ordersTable)
    .set({
      status: hasItems && allShipped ? 'BİTTİ' : 'ÜRETİM',
      updated_at: sql`now()`,
    })
    .where(eq(ordersTable.id, orderId))
}

export async function recalculateOrderReadyStatus(tx: any, orderId: number) {
  // 1. Get order type and items
  const order = await tx.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
    columns: { is_custom_order: true, status: true },
    with: {
      items: {
        where: isNull(orderItemsTable.deleted_at),
        with: {
          product: true,
        },
      },
    },
  })

  // Skip if not found or status shouldn't be auto-recalculated (e.g. BİTTİ or İPTAL)
  if (
    !order ||
    order.is_custom_order ||
    order.status === 'BİTTİ' ||
    order.status === 'İPTAL'
  ) {
    return
  }

  let fulfilledCount = 0
  const totalCount = order.items.length

  if (totalCount > 0) {
    for (const item of order.items) {
      if (item.product && item.product.stock_quantity >= item.quantity) {
        fulfilledCount++
      }
    }
  }

  let newStatus: string
  if (totalCount === 0) {
    newStatus = 'KAYIT'
  } else if (fulfilledCount === totalCount) {
    newStatus = 'HAZIR'
  } else if (fulfilledCount > 0) {
    newStatus = 'KISMEN HAZIR'
  } else {
    newStatus = 'KAYIT'
  }

  if (order.status !== newStatus) {
    await tx
      .update(ordersTable)
      .set({
        status: newStatus,
        updated_at: sql`now()`,
      })
      .where(eq(ordersTable.id, orderId))
  }
}

export function normalizeParams(value?: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

// Shared validation helper
export function validateCustomerInput(customer: InsertCustomer) {
  const fieldErrors: Record<
    string,
    { i18n: { ns: 'validation'; key: 'required' } }
  > = {}

  if (!customer.code.trim()) {
    fieldErrors.code = { i18n: { ns: 'validation', key: 'required' } }
  }
  if (!customer.name.trim()) {
    fieldErrors.name = { i18n: { ns: 'validation', key: 'required' } }
  }

  if (Object.keys(fieldErrors).length > 0) {
    failValidation(fieldErrors)
  }
}
