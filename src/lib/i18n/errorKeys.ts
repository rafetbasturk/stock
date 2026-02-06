// src/lib/i18n/errorKeys.ts
import type { ErrorCode } from "@/lib/error/core/errorCodes";

export type ValidationErrorKey =
  | "required"
  | "min_length"
  | "max_length"
  | "invalid_format"
  | "not_multiple_of"
  | "invalid";

export type AuthErrorKey = "invalid_credentials";

/**
 * Generic error codes map directly to ErrorCode
 */
export type GenericErrorKey = ErrorCode;

export type I18nErrorKey =
  | { ns: "validation"; key: ValidationErrorKey }
  | { ns: "auth"; key: AuthErrorKey }
  | { ns: "formErrors"; key: GenericErrorKey };

