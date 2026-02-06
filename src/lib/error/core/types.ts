// src/lib/error/core/types.ts

import { ErrorCode } from "./errorCodes";
import { ValidationErrorPayload } from "./errorTransport";

/**
 * AppErrorData
 * -------------
 * The normalized shape for all app-level errors.
 * Used across the entire error-handling stack.
 */
export interface AppErrorData {
  code: ErrorCode;
  status?: number;
  message?: string;
  details?: string | ValidationErrorPayload;
}
