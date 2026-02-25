import { useMutation } from '@tanstack/react-query'
import type { MutationFormErrors } from '@/lib/types/types.form'
import { AppError } from '@/lib/error/core'

type AnyFn = (...args: Array<any>) => Promise<any>

type UseFormMutationOptions<TMutationFn extends AnyFn> = {
  mutationFn: TMutationFn

  formErrorCodes?: Array<string>

  onFieldError?: MutationFormErrors['setAllErrors']

  onOptimistic?: (variables: Parameters<TMutationFn>[0]) => void

  onRollback?: (variables: Parameters<TMutationFn>[0]) => void

  onSuccess?: (
    data: Awaited<ReturnType<TMutationFn>>,
    variables: Parameters<TMutationFn>[0],
    context: unknown,
  ) => void
}

export function useFormMutation<TMutationFn extends AnyFn>({
  mutationFn,
  onSuccess,
  onFieldError,
  formErrorCodes = [],
  onOptimistic,
  onRollback,
}: UseFormMutationOptions<TMutationFn>) {
  return useMutation<
    Awaited<ReturnType<TMutationFn>>,
    unknown,
    Parameters<TMutationFn>[0]
  >({
    mutationFn,

    onMutate: (variables) => {
      onOptimistic?.(variables)
      return undefined
    },

    onSuccess: (data, variables, context) => {
      onSuccess?.(data, variables, context)
    },

    onError: (error, variables) => {
      onRollback?.(variables)

      const appError = AppError.from(error)

      console.error(appError.details)

      if (
        appError.code === 'VALIDATION_ERROR' &&
        appError.details &&
        typeof appError.details === 'object'
      ) {
        ;(error as any).__handledBySafeMutation = true
        onFieldError?.(appError.details.fieldErrors)
        return
      }

      if (formErrorCodes.includes(appError.code)) {
        ;(error as any).__handledBySafeMutation = true

        onFieldError?.({
          _form: {
            i18n: {
              ns: 'formErrors',
              key: appError.code,
            },
          },
        })
      }
    },
  })
}
