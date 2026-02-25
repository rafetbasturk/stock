// src/middleware/settings.ts
import { createMiddleware } from '@tanstack/react-start'
import {
  getCookie,
  getRequestHeader,
  setCookie,
} from '@tanstack/react-start/server'
import type { AppSettings, Language, Theme } from '@/lib/types/types.settings'

export const settingsMiddleware = createMiddleware().server(
  async ({ next }) => {
    // --- Language ---
    const cookieLang = getCookie('lang')
    const acceptLang = getRequestHeader('accept-language')

    let lang: Language = 'tr' // Default

    if (cookieLang === 'tr' || cookieLang === 'en') {
      lang = cookieLang
    } else if (acceptLang) {
      // Very simple parser for Accept-Language header (e.g., "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7")
      const primaryLang = acceptLang.split(',')[0].split('-')[0].toLowerCase()
      lang = primaryLang === 'en' ? 'en' : 'tr'
    }

    // --- Theme ---
    const themeCookie = getCookie('theme')
    const theme: Theme =
      themeCookie === 'light' ||
      themeCookie === 'dark' ||
      themeCookie === 'system'
        ? themeCookie
        : 'system'

    // --- Sidebar ---
    const cookieSidebar = getCookie('sidebar_state')
    const sidebarOpen = cookieSidebar !== 'false'

    // --- Timezone ---
    const cookieTimeZone = getCookie('tz')
    const timeZone = cookieTimeZone || 'UTC'

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
          sidebarOpen,
          timeZone,
        } satisfies AppSettings,
      },
    })
  },
)
