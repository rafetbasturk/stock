import { getUserFromSession } from './session'
import { fail } from '@/lib/error/core/serverError'

export async function requireAuth() {
  const user = await getUserFromSession()

  if (!user) {
    fail('UNAUTHORIZED')
  }

  return user
}
