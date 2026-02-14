// src/lib/error/core/serverError.ts
import { BaseAppError } from "./AppError";
import { normalizeServerError } from "./normalizeServerError";
import type { ErrorCode } from "./errorCodes";
import type { ValidationErrorPayload } from "./errorTransport";

export function fail(code: ErrorCode, details?: string): never {
  throw BaseAppError.create({ code, details });
}

export function failValidation(
  fieldErrors: ValidationErrorPayload["fieldErrors"]
): never {
  throw BaseAppError.create({
    code: "VALIDATION_ERROR",
    details: {
      type: "validation",
      fieldErrors,
    },
  });
}

export function throwTransportError(error: unknown): never {
  throw normalizeServerError(error);
}
