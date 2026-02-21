import { Language, Theme } from '../types/types.settings'

function applyThemeToDom(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)

  document.documentElement.classList.toggle('dark', isDark)
}

/**
 * Theme change is client-only and instant.
 */
export function setTheme(theme: Theme) {
  document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`
  applyThemeToDom(theme)
}

/**
 * Language change must be SSR-consistent.
 * Reload is intentional and correct.
 */
export function setLanguage(lang: Language) {
  document.cookie = `lang=${lang}; path=/; max-age=31536000`
  window.location.reload()
}
