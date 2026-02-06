// src/hooks/useFormState.ts
import { useCallback, useState } from "react";
import { useFormErrors } from "./useFormErrors";
import { FormController } from "@/lib/types";

export function useFormState<T extends Record<string, any>>(
  initial: T
): FormController<T> {
  const [values, setValues] = useState<T>(initial);
  const errors = useFormErrors();

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }));

      errors.clearField(String(key));
    },
    [errors]
  );

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
  };
}
