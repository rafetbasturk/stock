import { fail } from '@/lib/error/core/serverError'
import { getUserFromSession } from './session'

export async function requireAuth() {
  const user = await getUserFromSession()

  if (!user) {
    fail('UNAUTHORIZED')
  }

  return user
}
