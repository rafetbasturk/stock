// src/lib/types/types.form.ts
import type { FieldErrors } from "@/lib/error/utils/formErrors";

/**
 * What a mutation needs from a form
 * (nothing more, nothing less)
 */
export type MutationFormErrors = {
  setAllErrors: (next: FieldErrors) => void;
  resetErrors: () => void;
};

/**
 * What UI fields need from a form
 */
export type FormFieldErrors = FieldErrors & {
  clearField: (field: string) => void;
};

export type FormController<T> = {
  values: T;

  fieldErrors: FormFieldErrors;
  
  mutationErrors: MutationFormErrors;

  setValue: <TKey extends keyof T>(key: TKey, value: T[TKey]) => void;
};
