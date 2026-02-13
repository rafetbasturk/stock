// src/lib/error/core/AppError.ts
import { isZodError } from "../utils/isZodError";
import { isTransportError } from "./isTransportError";
import { getErrorMessage } from "./errorMessages";
import { getHttpStatusFromCode } from "./errorStatusMap";
import { zodToValidationPayload } from "./zodToValidationPayload";
import { normalizeTransportDetails } from "./normalizeTransportDetails";
import { ERROR_CODE_SYMBOL } from "./errorCodeMarker";
import type { ErrorWithCode } from "./errorCodeMarker";
import type { TransportError, ValidationErrorPayload } from "./errorTransport";
import type { AppErrorData, ErrorCode } from ".";

function extractTransportError(value: unknown): TransportError | null {
  if (isTransportError(value)) {
    return value;
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as any;
  const nestedCandidates = [
    candidate.data,
    candidate.cause,
    candidate.error,
    candidate.payload,
    candidate.response?.data,
    candidate.data?.data,
  ];

  for (const nested of nestedCandidates) {
    if (isTransportError(nested)) {
      return nested;
    }
  }

  return null;
}

export class BaseAppError extends Error implements AppErrorData {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: string | ValidationErrorPayload;

  protected constructor({ code, message, details, status }: AppErrorData) {
    super(message);
    this.name = "AppError";

    this.code = code;
    this.status = status ?? getHttpStatusFromCode(code);
    this.details = details;

    Error.captureStackTrace(this, new.target);
  }

  static create(data: AppErrorData): BaseAppError {
    return new BaseAppError(data);
  }

  static fromTransport(payload: TransportError): BaseAppError {
    return new BaseAppError({
      code: payload.code,
      message: payload.message,
      details: normalizeTransportDetails(payload),
    });
  }

  /**
   * Normalize any unknown error into a BaseAppError.
   * This is the single ingress point for error coercion.
   */
  static from(error: unknown): BaseAppError {
    if (error instanceof BaseAppError) {
      return error;
    }

    const transportError = extractTransportError(error);
    if (transportError) {
      return BaseAppError.fromTransport(transportError);
    }

    if (isZodError(error)) {
      return new BaseAppError({
        code: "VALIDATION_ERROR",
        details: zodToValidationPayload(error),
      });
    }

    if (error instanceof Error) {
      const maybeCode = (error as ErrorWithCode)[ERROR_CODE_SYMBOL];

      if (maybeCode) {
        return new BaseAppError({
          code: maybeCode,
          details: (error as any).details,
        });
      }

      return new BaseAppError({
        code: "UNKNOWN_ERROR",
        details: error.message,
      });
    }

    return new BaseAppError({
      code: "UNKNOWN_ERROR",
      details: String(error),
    });
  }

  toLogJSON() {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
      message: this.message,
      details: this.details,
      stack: this.stack,
    };
  }

  toPublicJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  toTransport(): TransportError {
    if (this.code === "VALIDATION_ERROR") {
      if (
        !this.details ||
        typeof this.details !== "object" ||
        !("fieldErrors" in this.details)
      ) {
        throw new Error(
          "VALIDATION_ERROR requires ValidationErrorPayload details"
        );
      }

      return {
        code: this.code,
        message: this.message,
        details: this.details,
      };
    }

    if (typeof this.details === "string") {
      return {
        code: this.code,
        message: this.message,
        details: { type: "text", value: this.details },
      };
    }

    return {
      code: this.code,
      message: this.message,
      details: { type: "unknown" },
    };
  }
}

export class AppError extends BaseAppError {
  static from(error: unknown): AppError {
    const base = BaseAppError.from(error);
    return new AppError(base);
  }

  protected constructor({ code, message, details, status }: AppErrorData) {
    const localized = message?.trim() || getErrorMessage(code);
    super({ code, message: localized, details, status });
  }
}
