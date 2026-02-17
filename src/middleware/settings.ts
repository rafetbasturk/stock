// src/server/middleware/settings.middleware.ts
import { AppSettings } from '@/lib/types/types.settings'
import { createMiddleware } from '@tanstack/react-start'
import {
  getCookie,
  getRequestHeader,
  setCookie,
} from '@tanstack/react-start/server'

export const settingsMiddleware = createMiddleware().server(
  async ({ next }) => {
    // --- Language ---
    const cookieLang = getCookie('lang')
    const acceptLang = getRequestHeader('accept-language')

    let lang: AppSettings['lang'] = 'tr' // Default

    if (cookieLang === 'tr' || cookieLang === 'en') {
      lang = cookieLang
    } else if (acceptLang) {
      // Very simple parser for Accept-Language header (e.g., "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7")
      const primaryLang = acceptLang.split(',')[0].split('-')[0].toLowerCase()
      lang = primaryLang === 'en' ? 'en' : 'tr'
    }

    // --- Theme ---
    const themeCookie = getCookie('theme')
    const theme = (themeCookie ?? 'system') as AppSettings['theme']

    // Only set cookies if they don't exist (to avoid overwriting client-side changes)
    if (!cookieLang) {
      setCookie('lang', lang, { path: '/', maxAge: 31536000 })
    }
    if (!themeCookie) {
      setCookie('theme', theme, { path: '/', maxAge: 31536000 })
    }

    return next({
      context: {
        settings: {
          lang,
          theme,
          sidebarOpen: true,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        } satisfies AppSettings,
      },
    })
  },
)
