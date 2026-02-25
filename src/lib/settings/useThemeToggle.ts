// src/lib/settings/useThemeToggle.ts
import { useCallback } from 'react'
import { setTheme } from './clientSettings'
import type { Theme } from '../types/types.settings'

export function useThemeToggle() {
  const toggleTheme = useCallback(() => {
    const isDark =
      document.documentElement.classList.contains('dark')

    const nextTheme: Theme = isDark ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [])

  return { toggleTheme }
}
