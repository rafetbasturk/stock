// src/lib/error/utils/formErrors.ts
import type { I18nErrorMessage } from "../core/errorTransport";

export type FieldErrorValue = I18nErrorMessage;

export type FieldErrors = {
  [field: string]: FieldErrorValue | undefined;
  _form?: FieldErrorValue;
};

export function normalizeFieldPath(path: string): string {
  return path.replace(/\.(\d+)(?=\.|$)/g, "[$1]");
}

export function normalizeFieldErrors(errors: FieldErrors): FieldErrors {
  const normalized: FieldErrors = {};

  for (const [field, error] of Object.entries(errors)) {
    const normalizedField = field === "_form" ? field : normalizeFieldPath(field);
    normalized[normalizedField] = error;
  }

  return normalized;
}
