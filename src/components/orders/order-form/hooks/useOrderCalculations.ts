import { useMemo } from 'react'
import type { Currency, NewOrderItem } from '@/types'
import type { OrderFormState } from '../../OrderForm'
import { convertToCurrencyFormat } from '@/lib/currency'

export function useOrderCalculations(
  items: Array<NewOrderItem> | OrderFormState['customItems'],
  currency: Currency,
) {
  const totalCents = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = Number(item.quantity ?? 0)
        const price = Number(item.unit_price ?? 0)
        return sum + qty * price
      }, 0),
    [items],
  )

  const formattedTotal = useMemo(
    () =>
      convertToCurrencyFormat({
        cents: totalCents,
        currency,
      }),
    [currency, totalCents],
  )

  return { totalCents, formattedTotal }
}
