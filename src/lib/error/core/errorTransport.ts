// src/lib/error/core/errorTransport.ts
import type { ErrorCode } from "./errorCodes";
import type { I18nErrorKey } from "@/lib/i18n/errorKeys";

export interface I18nErrorMessage {
  i18n: I18nErrorKey;
  params?: Record<string, string | number>;
}

export interface ValidationErrorPayload {
  type: "validation";
  fieldErrors: Record<string, I18nErrorMessage>;
}

type NonValidationDetails =
  | { type: "text"; value: string }
  | { type: "unknown" };

export type TransportError =
  | {
      code: "VALIDATION_ERROR";
      message?: string;
      details: ValidationErrorPayload;
    }
  | {
      code: ErrorCode;
      message?: string;
      details?: NonValidationDetails;
    };
