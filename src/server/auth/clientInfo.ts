import { getRequestHeader } from '@tanstack/react-start/server'

export function getClientIP(): string | null {
  const cf = getRequestHeader('cf-connecting-ip')
  if (cf) return cf

  const xff = getRequestHeader('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()

  const real = getRequestHeader('x-real-ip')
  if (real) return real

  // Avoid shared lock/rate-limit buckets when upstream IP headers are unavailable.
  return null
}

export function getUserAgent(): string | null {
  const raw = getRequestHeader('user-agent')
  return raw ? raw.slice(0, 500) : null
}
