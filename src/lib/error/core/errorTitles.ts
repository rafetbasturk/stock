import { ERROR_TITLE_KEY_MAP } from "./errorTitleMap";
import type { ErrorCode } from "./errorCodes";
import type { TitleKey } from "./errorTitleKeys";
import type { Language } from "@/lib/types/types.settings";
import { getUserLang } from "@/lib/i18n/getUserLang";

import trTitles from "@/lib/i18n/locales/tr/errors.titles.json";
import enTitles from "@/lib/i18n/locales/en/errors.titles.json";

const TITLES_BY_LANG: Record<Language, Record<TitleKey, string>> = {
  tr: trTitles,
  en: enTitles,
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
