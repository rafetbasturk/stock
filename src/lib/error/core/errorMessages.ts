// src/lib/error/core/errorMessages.ts
import { ERROR_MESSAGE_KEY_MAP } from "./errorMessageMap";
import type { ErrorCode } from "./errorCodes";
import type { MessageKey } from "./errorMessageKeys";
import type { Language } from "@/lib/types/types.settings";
import { getUserLang } from "@/lib/i18n/getUserLang";

const ALL_MESSAGES: Record<Language, Record<MessageKey, string>> = {
  en: {
    FETCH_FAILED: "Failed to load data.",
    SAVE_FAILED: "Failed to save changes.",
    DELETE_FAILED: "Failed to delete item.",
    NOT_FOUND: "Requested data was not found.",
    ALREADY_EXISTS: "This record already exists.",
    ORDER_LOCKED: "This order can no longer be modified.",
    INSUFFICIENT_STOCK: "Insufficient stock available.",
    PRODUCT_HAS_STOCK: "Product has stock",
    VALIDATION_ERROR: "Some fields contain invalid values.",
    INVALID_CREDENTIALS: "Invalid username or password.",
    ACCOUNT_LOCKED:
      "Your account is temporarily locked due to too many failed attempts.",
    RATE_LIMIT_EXCEEDED: "Too many login attempts. Please try again later.",
    SESSION_INVALID: "Your session has expired.",
    UNAUTHORIZED: "You are not authorized to perform this action.",
    FORBIDDEN: "You do not have permission to access this resource.",
    NETWORK_ERROR: "Network connection failed.",
    INTERNAL_ERROR: "An internal system error occurred.",
    UNKNOWN_ERROR: "An unexpected error occurred.",
  },
  tr: {
    FETCH_FAILED: "Veriler yüklenemedi.",
    SAVE_FAILED: "Değişiklikler kaydedilemedi.",
    DELETE_FAILED: "Kayıt silinemedi.",
    NOT_FOUND: "İstenen veri bulunamadı.",
    ALREADY_EXISTS: "Bu kayıt zaten mevcut.",
    ORDER_LOCKED: "Bu sipariş artık değiştirilemez.",
    INSUFFICIENT_STOCK: "Yetersiz stok.",
    PRODUCT_HAS_STOCK: "Stokta ürün mevcut.",
    VALIDATION_ERROR: "Bazı alanlarda geçersiz değerler var.",
    INVALID_CREDENTIALS: "Kullanıcı adı veya şifre hatalı.",
    ACCOUNT_LOCKED:
      "Çok fazla başarısız deneme nedeniyle hesabınız geçici olarak kilitlendi.",
    RATE_LIMIT_EXCEEDED:
      "Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.",
    SESSION_INVALID: "Oturum süresi doldu.",
    UNAUTHORIZED: "Bu işlem için yetkiniz yok.",
    FORBIDDEN: "Bu kaynağa erişim izniniz yok.",
    NETWORK_ERROR: "Ağ bağlantısı kurulamadı.",
    INTERNAL_ERROR: "Dahili bir sistem hatası oluştu.",
    UNKNOWN_ERROR: "Beklenmeyen bir hata oluştu.",
  },
};

export function getErrorMessageByLang(code: ErrorCode, lang: Language): string {
  const key: MessageKey = ERROR_MESSAGE_KEY_MAP[code];
  return ALL_MESSAGES[lang][key];
}

export function getErrorMessage(code: ErrorCode): string {
  return getErrorMessageByLang(code, getUserLang());
}
