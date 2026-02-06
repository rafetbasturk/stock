// src/lib/currency.ts
import { BaseAppError } from '@/lib/error/core/AppError'
import type { Currency } from '../types'

export const currencyArray = ['TRY', 'EUR', 'USD'] as const

export const currencyFlags: Record<string, string> = {
  TRY: '🇹🇷',
  EUR: '🇪🇺',
  USD: '🇺🇸',
  tr: '🇹🇷',
  en: '🇺🇸',
} as const

export type Rate = {
  currency: Currency
  targetCurrency: Currency
  rate: number
}

export const fallbackRates: Rate[] = [
  { currency: 'TRY', targetCurrency: 'EUR', rate: 0.02064 },
  { currency: 'TRY', targetCurrency: 'USD', rate: 0.02397 },
  { currency: 'TRY', targetCurrency: 'TRY', rate: 1 },
  { currency: 'USD', targetCurrency: 'EUR', rate: 0.86125 },
  { currency: 'USD', targetCurrency: 'TRY', rate: 41.724 },
  { currency: 'USD', targetCurrency: 'USD', rate: 1 },
  { currency: 'EUR', targetCurrency: 'TRY', rate: 48.446 },
  { currency: 'EUR', targetCurrency: 'USD', rate: 1.1611 },
  { currency: 'EUR', targetCurrency: 'EUR', rate: 1 },
]

export const EXCHANGE_RATE_UPDATE_INTERVAL = 24 * 60 * 60 * 1000

export function shouldUpdateRates(updateTimestamp: number | null): boolean {
  return (
    !updateTimestamp ||
    Date.now() - updateTimestamp >= EXCHANGE_RATE_UPDATE_INTERVAL
  )
}

// Helper function to filter and transform rates from storage
export const transformRates = (
  rates: Rate[],
  currency: string,
): Record<string, number> => {
  return rates
    .filter((rate) => rate.currency === currency)
    .reduce(
      (acc, rate) => {
        acc[rate.targetCurrency] = rate.rate
        return acc
      },
      {} as Record<string, number>,
    )
}

// Fetch all rates for a single base currency in one API call
export async function fetchRatesForCurrency(base: Currency): Promise<Rate[]> {
  const url = new URL('https://api.frankfurter.dev/v1/latest')
  url.searchParams.set('base', base)

  // Ask the API only for the currencies you support (smaller payload, faster)
  const symbols = currencyArray.filter((c) => c !== base).join(',')
  if (symbols) url.searchParams.set('symbols', symbols)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      // Optional: avoid stale cached responses in some environments
      cache: 'no-store',
    })

    // Try to parse JSON even on errors (but safely)
    let data: any = null
    try {
      data = await response.json()
    } catch {
      // keep data = null; handled below
    }

    if (!response.ok) {
      throw BaseAppError.create({
        code: 'CURRENCY_RATE_FETCH_FAILED',
        details: `HTTP ${response.status}`,
      })
    }

    if (!data?.rates || typeof data.rates !== 'object') {
      throw BaseAppError.create({
        code: 'CURRENCY_RATE_INVALID_RESPONSE',
        details: 'Missing or invalid rates field',
      })
    }

    const rates: Rate[] = Object.entries(data.rates)
      .map(([target, rate]) => ({
        currency: base,
        targetCurrency: target as Currency,
        rate: Number(rate),
      }))
      .filter((r) => Number.isFinite(r.rate))

    // Always include self-reference rate = 1
    rates.push({ currency: base, targetCurrency: base, rate: 1 })

    return rates
  } catch (err) {
    // If fetch was aborted (timeout), surface a meaningful error
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw BaseAppError.create({
        code: 'CURRENCY_RATE_TIMEOUT',
        details: 'Request aborted due to timeout',
      })
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

function createCurrencyCombinations(currencies: string[]): string[][] {
  const combinations: string[][] = []

  for (let i = 0; i < currencies.length; i++) {
    for (let j = 0; j < currencies.length; j++) {
      const from = currencies[i]
      const to = currencies[j]
      if (from !== undefined && to !== undefined) {
        combinations.push([from, to])
      }
    }
  }

  return combinations
}

export const currencyCombinations = createCurrencyCombinations([
  ...currencyArray,
])

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Rate[],
) {
  // If same currency, return original amount
  if (fromCurrency === toCurrency) {
    return parseFloat(amount.toFixed(2))
  }

  // Find the conversion rate
  const rateObj = rates.find(
    (rate) =>
      rate.currency === fromCurrency && rate.targetCurrency === toCurrency,
  )

  if (rateObj) {
    return Math.round(parseFloat((amount * rateObj.rate).toFixed(2)))
  }

  // If direct rate not found, try to find reverse rate
  const reverseRateObj = rates.find(
    (rate) =>
      rate.currency === toCurrency && rate.targetCurrency === fromCurrency,
  )

  if (reverseRateObj) {
    return Math.round(parseFloat((amount / reverseRateObj.rate).toFixed(2)))
  }

  // If neither direct nor reverse rate found, try conversion through USD
  const toUSDRate = rates.find(
    (rate) => rate.currency === fromCurrency && rate.targetCurrency === 'USD',
  )
  const fromUSDRate = rates.find(
    (rate) => rate.currency === 'USD' && rate.targetCurrency === toCurrency,
  )

  if (toUSDRate && fromUSDRate) {
    const usdAmount = amount * toUSDRate.rate
    return Math.round(parseFloat((usdAmount * fromUSDRate.rate).toFixed(2)))
  }

  throw BaseAppError.create({
    code: 'CURRENCY_RATE_NOT_FOUND',
    details: `Conversion rate not found from ${fromCurrency} to ${toCurrency}`,
  })
}

export const convertToCurrencyFormat = ({
  cents,
  currency = 'TRY',
  locale = 'tr-TR',
  compact = false,
}: {
  cents: number
  currency?: Currency
  locale?: Intl.LocalesArgument
  compact?: boolean
}) => {
  const amount = cents / 100

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    ...(compact && { notation: 'compact' }),
  }).format(amount)
}

/**
 * Convert amount between currencies using available rates.
 * Supports direct, reverse, and indirect (bridge) conversions.
 */

// Backend uses this
export function convertToBaseCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: Rate[],
): number {
  if (from === to) return amount

  // Direct conversion (EUR → USD)
  const direct = rates.find(
    (r) => r.currency === from && r.targetCurrency === to,
  )
  if (direct) return amount * direct.rate

  // Reverse conversion (USD → EUR via EUR→USD)
  const reverse = rates.find(
    (r) => r.currency === to && r.targetCurrency === from,
  )
  if (reverse) return amount / reverse.rate

  // Indirect conversions via common bridge currencies
  const bridgeCurrencies: Currency[] = ['TRY', 'USD', 'EUR']
  for (const bridge of bridgeCurrencies) {
    if (bridge === from || bridge === to) continue

    const toBridge = rates.find(
      (r) => r.currency === from && r.targetCurrency === bridge,
    )
    const bridgeToTarget = rates.find(
      (r) => r.currency === bridge && r.targetCurrency === to,
    )

    if (toBridge && bridgeToTarget) {
      return amount * toBridge.rate * bridgeToTarget.rate
    }
  }

  console.warn(
    `[convertToBaseCurrency] No conversion path found: ${from} → ${to}. Returning amount unchanged.`,
  )
  return amount
}

/**
 * Format price in cents to a localized currency string
 * @param priceInCents - Price stored in cents (e.g., 10000 = 100.00)
 * @param currency - Currency code (TRY, EUR, USD, etc.)
 * @param locale - Locale for formatting (default: 'tr-TR')
 * @returns Formatted currency string (e.g., "₺100,00")
 */
export function formatPrice(
  priceInCents: number,
  currency: Currency = 'TRY',
  locale: string = 'tr-TR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(priceInCents / 100)
}
