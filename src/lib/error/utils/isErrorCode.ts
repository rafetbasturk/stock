// src/lib/error/utils/isErrorCode.ts
import { ERROR_CODES } from "../core/errorCodes";
import type { ErrorCode } from "../core/errorCodes";

export function isErrorCode(value: unknown): value is ErrorCode {
  return (
    typeof value === "string" &&
    (ERROR_CODES as ReadonlyArray<string>).includes(value)
  );
}
