import type { ErrorCode } from "./errorCodes";

export const ERROR_CODE_SYMBOL = Symbol("AppErrorCode");

export interface ErrorWithCode extends Error {
  [ERROR_CODE_SYMBOL]?: ErrorCode;
}

/**
 * Create a lightweight Error that carries an ErrorCode.
 * Useful for early exits without constructing AppError directly.
 */
export function errorCode(code: ErrorCode): Error {
  const err = new Error(code);
  (err as ErrorWithCode)[ERROR_CODE_SYMBOL] = code;
  return err;
}
