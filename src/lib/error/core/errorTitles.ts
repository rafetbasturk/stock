import { ERROR_TITLE_KEY_MAP } from "./errorTitleMap";
import type { ErrorCode } from "./errorCodes";
import type { TitleKey } from "./errorTitleKeys";
import type { Language } from "@/lib/types/types.settings";
import { getUserLang } from "@/lib/i18n/getUserLang";

const TITLES_BY_LANG: Record<Language, Record<TitleKey, string>> = {
  en: {
    AUTH_ERROR: "Login failed",
    SESSION_EXPIRED: "Session expired",
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Access denied",
    NETWORK_ERROR: "Connection error",
    VALIDATION_ERROR: "Invalid data",
    SYSTEM_ERROR: "System error",
    UNKNOWN_ERROR: "Error",
  },
  tr: {
    AUTH_ERROR: "Giris basarisiz",
    SESSION_EXPIRED: "Oturum suresi doldu",
    UNAUTHORIZED: "Yetkisiz islem",
    FORBIDDEN: "Erisim engellendi",
    NETWORK_ERROR: "Baglanti hatasi",
    VALIDATION_ERROR: "Gecersiz veri",
    SYSTEM_ERROR: "Sistem hatasi",
    UNKNOWN_ERROR: "Hata",
  },
};

const DEFAULT_TITLE_KEY: TitleKey = "UNKNOWN_ERROR";

/**
 * Pure resolver (core / tests / server-safe)
 */
export function getErrorTitleByLang(code: ErrorCode, lang: Language): string {
  const titleKey = ERROR_TITLE_KEY_MAP[code] ?? DEFAULT_TITLE_KEY;
  return TITLES_BY_LANG[lang][titleKey];
}

/**
 * UI convenience wrapper
 */
export function getErrorTitle(code: ErrorCode): string {
  return getErrorTitleByLang(code, getUserLang());
}
