export const TITLE_KEYS = [
  "AUTH_ERROR",
  "SESSION_EXPIRED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NETWORK_ERROR",
  "VALIDATION_ERROR",
  "SYSTEM_ERROR",
  "UNKNOWN_ERROR",
] as const;

export type TitleKey = (typeof TITLE_KEYS)[number];
