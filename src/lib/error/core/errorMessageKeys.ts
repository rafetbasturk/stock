// src/lib/error/core/errorMessageKeys.ts
export const ERROR_MESSAGE_KEYS = [
  // 📦 Generic operations
  "FETCH_FAILED",
  "SAVE_FAILED",
  "DELETE_FAILED",

  // 🔍 Lookup
  "NOT_FOUND",
  "ALREADY_EXISTS",

  // 🧾 Domain rules
  "ORDER_LOCKED",
  "INSUFFICIENT_STOCK",

  // ⚙️ Validation
  "VALIDATION_ERROR",

  // 🔐 Authentication / Authorization
  "INVALID_CREDENTIALS",
  "SESSION_INVALID",
  "UNAUTHORIZED",
  "FORBIDDEN",

  // 🌐 Infrastructure / System
  "NETWORK_ERROR",
  "INTERNAL_ERROR",
  "UNKNOWN_ERROR",
] as const;

export type MessageKey = (typeof ERROR_MESSAGE_KEYS)[number];
