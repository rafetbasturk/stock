import { TR } from '@/lib/constants'
import { BaseAppError } from '@/lib/error/core'
import { DeliveryWithItems, InsertProduct, OrderWithItems } from '@/types'

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
  if (!product.code?.trim()) {
    throw BaseAppError.create({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Product code is required',
    })
  }
  if (!product.name?.trim()) {
    throw BaseAppError.create({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Product name is required',
    })
  }
  if (product.customer_id <= 0)
    throw BaseAppError.create({ status: 400, code: 'INVALID_ID' })
}

export const editProductBeforeInsert = (product: InsertProduct) => {
  // Required fields (create). For update, these guards avoid runtime errors.
  if (product.code != null) {
    const code = normalizeCode(product.code)
    if (code) product.code = code
  }

  if (product.name != null) {
    const name = normalizeText(product.name)
    if (name) {
      // keep your “capitalize first letter” behavior, but TR-locale safe
      product.name = name[0]!.toLocaleUpperCase(TR) + name.slice(1)
    }
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
      ? (data.customItems ?? [])
      : (data.items ?? [])

    totalCents = sourceItems.reduce((sum, item) => {
      const price = item.unit_price ?? 0 // already cents
      const qty = item.quantity ?? 0
      return sum + price * qty
    }, 0)
  }

  // ---- Case 2: Delivery object ----
  if ('delivery_number' in data) {
    totalCents = (data.items ?? []).reduce((sum, item) => {
      const price =
        item.orderItem?.unit_price ?? item.customOrderItem?.unit_price ?? 0 // cents
      const qty = item.delivered_quantity ?? 0
      return sum + price * qty
    }, 0)
  }

  // convert to "normal" number with 2 decimal places
  const total_amount = Number((totalCents / 100).toFixed(2))

  return { ...data, total_amount }
}
