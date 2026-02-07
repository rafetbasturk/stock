// src/lib/error/core/serverError.ts
import { BaseAppError } from "./AppError";
import { normalizeServerError } from "./normalizeServerError";
import type { ErrorCode } from "./errorCodes";

export function fail(code: ErrorCode, details?: string): never {
  throw BaseAppError.create({ code, details });
}

export function throwTransportError(error: unknown): never {
  throw normalizeServerError(error);
}
