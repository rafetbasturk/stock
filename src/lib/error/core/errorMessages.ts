// src/lib/error/core/errorMessages.ts
import { getUserLang } from "@/lib/i18n/getUserLang";
import type { ErrorCode } from "./errorCodes";
import type { MessageKey } from "./errorMessageKeys";
import type { Language } from "@/lib/types/types.settings";
import { ERROR_MESSAGE_KEY_MAP } from "./errorMessageMap";
import trMessages from "@/lib/i18n/locales/tr/errors.messages.json";
import enMessages from "@/lib/i18n/locales/en/errors.messages.json";

const ALL_MESSAGES: Record<Language, Record<MessageKey, string>> = {
  tr: trMessages,
  en: enMessages,
};

export function getErrorMessageByLang(code: ErrorCode, lang: Language): string {
  const key: MessageKey = ERROR_MESSAGE_KEY_MAP[code] ?? "UNKNOWN_ERROR";

  return (
    ALL_MESSAGES[lang][key] ?? ALL_MESSAGES.en[key] // absolute fallback
  );
}

export function getErrorMessage(code: ErrorCode): string {
  return getErrorMessageByLang(code, getUserLang());
}
