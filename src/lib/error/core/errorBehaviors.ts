// src/lib/error/core/errorBehaviors.ts
import { ErrorCode } from "./errorCodes";

export interface ErrorBehavior {
  silent?: boolean;
  requiresAuthRedirect?: boolean;
}

export const ERROR_BEHAVIORS: Partial<Record<ErrorCode, ErrorBehavior>> = {
  VALIDATION_ERROR: { silent: true },

  SESSION_INVALID: { requiresAuthRedirect: true },
  AUTH_HEADER_MISSING: { requiresAuthRedirect: true },
  REFRESH_TOKEN_MISSING: { requiresAuthRedirect: true },
  UNAUTHORIZED: { requiresAuthRedirect: true },
};
