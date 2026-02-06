import type { ErrorCode } from "./errorCodes";
import type { TitleKey } from "./errorTitleKeys";

export const ERROR_TITLE_KEY_MAP: Partial<Record<ErrorCode, TitleKey>> = {
  // 🔐 Auth
  INVALID_CREDENTIALS: "AUTH_ERROR",
  USER_NOT_FOUND: "AUTH_ERROR",
  SESSION_INVALID: "SESSION_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // ⚙️ Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // 🌐 Infra
  NETWORK_ERROR: "NETWORK_ERROR",
  INTERNAL_ERROR: "SYSTEM_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};
