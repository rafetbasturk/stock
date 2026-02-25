// src/hooks/useFormState.ts
import { useCallback, useState } from 'react'
import { useFormErrors } from './useFormErrors'
import type { FormController } from '@/lib/types/types.form'

export function useFormState<T extends Record<string, any>>(
  initial: T,
): FormController<T> {
  const [values, setValues] = useState<T>(initial)
  const errors = useFormErrors()

  const setValue = useCallback(
    <TKey extends keyof T>(key: TKey, value: T[TKey]) => {
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }))

      errors.clearField(String(key))
    },
    [errors],
  )

  return {
    values,

    fieldErrors: Object.assign(errors.errors, {
      clearField: errors.clearField,
    }),

    mutationErrors: {
      setAllErrors: errors.setAllErrors,
      resetErrors: errors.resetErrors,
    },

    setValue,
  }
}
