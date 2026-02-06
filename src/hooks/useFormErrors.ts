import { useCallback, useState } from "react";
import type { FieldErrors } from "@/lib/error/utils/formErrors";

export function useFormErrors(initial: FieldErrors = {}) {
  const [errors, setErrors] = useState<FieldErrors>(initial);

  /** Replace all errors (used by mutations) */
  const setAllErrors = useCallback((next: FieldErrors) => {
    setErrors(next);
  }, []);

  /** Clear a specific field + always clear _form */
  const clearField = useCallback((name: string) => {
    setErrors((prev) => {
      if (!prev[name] && !prev._form) return prev;

      return {
        ...prev,
        [name]: undefined,
        _form: undefined,
      };
    });
  }, []);

  /** Clear only the form-level error */
  const clearForm = useCallback(() => {
    setErrors((prev) => {
      if (!prev._form) return prev;
      return { ...prev, _form: undefined };
    });
  }, []);

  /** Clear everything */
  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    setAllErrors,
    clearField,
    clearForm,
    resetErrors,
  };
}
