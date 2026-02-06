// src/lib/error/core/normalizeServerError.ts
import { ZodError } from "zod";
import { BaseAppError } from "./AppError";
import { zodToValidationPayload } from "./zodToValidationPayload";
import type { TransportError } from "./errorTransport";

export function normalizeServerError(error: unknown): TransportError {
  if (error instanceof ZodError) {
    return {
      code: "VALIDATION_ERROR",
      details: zodToValidationPayload(error),
    };
  }

  return BaseAppError.from(error).toTransport();
}
