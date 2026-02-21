import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { authLogin, authLogout } from '@/server/auth'
import { useAuthStore } from '@/stores/authStore'
import { meQuery } from '@/lib/queries/auth'
import { useFormMutation } from '@/hooks/useFormMutation'
import { MutationFormErrors } from '../types/types.form'
import { LogoutReason } from '../types/types.auth'

function safeRedirect(redirect?: string) {
  if (!redirect) return '/'
  if (!redirect.startsWith('/')) return '/'
  if (redirect.startsWith('//')) return '/'
  return redirect
}

export function useLoginMutation(
  redirect?: string,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const login = useServerFn(authLogin)
  const { t } = useTranslation('auth')

  return useFormMutation({
    mutationFn: (data: { username: string; password: string }) =>
      login({ data }),

    formErrorCodes: [
      'INVALID_CREDENTIALS',
      'USER_NOT_FOUND',
      'ACCOUNT_LOCKED',
      'RATE_LIMIT_EXCEEDED',
    ],

    onFieldError: formErrors?.setAllErrors,

    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: (user) => {
      qc.setQueryData(meQuery.queryKey, user)
      navigate({ to: safeRedirect(redirect), replace: true })
      toast.dismiss()
      toast.success(t('welcome', { username: user.username }))
    },
  })
}

export function useLogoutMutation() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const clearSessionStore = useAuthStore((s) => s.clearSessionStore)
  const { t } = useTranslation('auth')

  return useMutation<
    void, // mutation result
    unknown, // error
    LogoutReason // mutation variables
  >({
    mutationFn: async () => {
      await authLogout()
    },

    onSuccess: async (_data, reason) => {
      clearSessionStore()
      await qc.cancelQueries({ queryKey: ['auth'] })
      qc.setQueryData(['auth', 'me'], null)

      // 🔔 Show toast BEFORE navigation (only for inactivity)
      if (reason === 'inactivity') {
        toast.warning(t('logout_inactivity'), {
          id: 'logout-inactivity',
          closeButton: true,
          duration: Infinity,
        })
      }

      if (reason === 'session-expired') {
        toast.error(t('session_expired_title'), {
          description: t('session_expired_description'),
          id: 'logout-session-expired',
          closeButton: true,
          duration: Infinity,
        })
      }

      navigate({
        to: '/login',
        replace: true,
      })
    },

    onError: async (_err, reason = 'manual') => {
      clearSessionStore()
      qc.setQueryData(['auth', 'me'], null)

      if (reason === 'session-expired') {
        toast.error(t('session_expired_title'), {
          description: t('session_expired_description'),
          id: 'logout-session-expired',
          closeButton: true,
          duration: Infinity,
        })
      }

      navigate({
        to: '/login',
        replace: true,
      })
    },
  })
}
