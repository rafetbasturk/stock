// src/lib/error/errorPresenter.ts
import type { FieldErrors } from "@/lib/error/utils/formErrors";
import type { TFunction } from "i18next";

export function getFormErrorMessage(
  errors: FieldErrors,
  t: TFunction
): string | null {
  const error = errors._form;
  if (!error) return null;

  return t(`${error.key.ns}:${error.key.key}`, error.params);
}

export function getFieldErrorMessage(
  errors: FieldErrors,
  field: string,
  t: TFunction
): string | null {
  const error = errors[field];
  if (!error) return null;

  return t(`${error.key.ns}:${error.key.key}`, error.params);
}
