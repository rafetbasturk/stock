// src/lib/i18n/createI18n.ts
import { createInstance, type i18n as I18nType } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'

const cache = new Map<string, I18nType>()

export function createI18n(lang: string) {
  if (cache.has(lang)) {
    return cache.get(lang)!
  }

  const i18n = createInstance()

  i18n
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (lng: string, ns: string) => import(`./locales/${lng}/${ns}.json`),
      ),
    )
    .init({
      lng: lang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      ns: ['auth', 'validation', 'formErrors'],
      react: { useSuspense: true },
      debug: false,
    })

  cache.set(lang, i18n)
  return i18n
}
