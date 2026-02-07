// src/lib/i18n/getUserLang.ts

import type { Language } from "../types/types.settings";

const FALLBACK_LANG: Language = "en";

export function getUserLang(): Language {
  // SSR-safe
  if (typeof window === "undefined") {
    return FALLBACK_LANG;
  }

  const settings = (window as any).__APP_SETTINGS__;

  if (settings?.lang === "en" || settings?.lang === "tr") {
    return settings.lang;
  }

  return FALLBACK_LANG;
}
