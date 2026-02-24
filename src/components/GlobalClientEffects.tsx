import { useErrorToast } from '@/hooks/useErrorToast'
import { useSessionPolicy } from '@/hooks/useSessionManager'

export default function GlobalClientEffects() {
  useErrorToast()
  useSessionPolicy()

  return null
}
