// src/components/AppSidebar.tsx
import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  HandCoinsIcon,
  LanguagesIcon,
  LucideLogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select'
import type { AppSettings, Language } from '@/lib/types/types.settings'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

import { cn } from '@/lib/utils'
import { currencyArray, currencyFlags } from '@/lib/currency'
import { useExchangeRatesStore } from '@/stores/exchangeRatesStore'
import { useSidebarRoutes } from '@/hooks/isSidebarRoutes'
import { setLanguage } from '@/lib/settings/clientSettings'
import { useThemeToggle } from '@/lib/settings/useThemeToggle'
import { useMounted } from '@/hooks/useMounted'
import { useLogoutMutation } from '@/lib/mutations/auth'
import { Image } from '@unpic/react'

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/'
}

export function AppSidebar({ settings }: { settings: AppSettings }) {
  const { t } = useTranslation('sidebar')
  const { toggleSidebar, open } = useSidebar()
  const { lang } = settings
  const { toggleTheme } = useThemeToggle()

  const mounted = useMounted()
  const [isDark, setIsDark] = useState(false)

  const routes = useSidebarRoutes()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const preferredCurrency = useExchangeRatesStore((s) => s.preferredCurrency)
  const setPreferredCurrency = useExchangeRatesStore(
    (s) => s.setPreferredCurrency,
  )

  const logoutMutation = useLogoutMutation()

  const handleSidebarClick: React.MouseEventHandler = (e) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-sidebar-interactive]')) return
    toggleSidebar()
  }

  useEffect(() => {
    if (!mounted) return

    const html = document.documentElement
    const syncIsDark = () => setIsDark(html.classList.contains('dark'))

    syncIsDark()

    const observer = new MutationObserver(syncIsDark)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [mounted])

  return (
    <Sidebar collapsible="icon" onClick={handleSidebarClick}>
      <SidebarContent className="flex justify-between">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold mb-4">
            <Image
              src="/favicon-256.png"
              alt="Logo"
              width={28}
              height={28}
              className="inline-block mr-2"
            />
            {t('title')}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map((route) => {
                const isExact =
                  normalizePath(pathname) === normalizePath(route.to)

                return (
                  <SidebarMenuItem key={route.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isExact}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isExact) e.preventDefault()
                      }}
                      className={cn(
                        'data-[active=true]:bg-primary/10 data-[active=true]:text-primary',
                        isExact && 'cursor-not-allowed',
                      )}
                    >
                      <Link to={route.to}>
                        <route.icon className="h-4 w-4" />
                        <span>
                          {t(route.label, { defaultValue: route.label })}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarFooter>
          <SidebarMenu className="space-y-1">
            {/* Currency */}
            <SidebarMenuItem
              data-sidebar-interactive
              onClick={(e) => e.stopPropagation()}
            >
              {mounted ? (
                <Select
                  value={preferredCurrency}
                  onValueChange={setPreferredCurrency}
                >
                  <SelectTrigger
                    data-sidebar-interactive
                    className={cn(
                      'w-full',
                      !open &&
                        'justify-center w-8 px-0 [&>svg:last-child]:hidden',
                    )}
                  >
                    <HandCoinsIcon className="h-4 w-4 text-sidebar-foreground" />
                    {open && (
                      <div className="flex items-center gap-1">
                        <span>{currencyFlags[preferredCurrency]}</span>
                        <span>{preferredCurrency}</span>
                      </div>
                    )}
                  </SelectTrigger>

                  <SelectContent position="popper" side="top" sideOffset={8}>
                    {currencyArray.map((c) => (
                      <SelectItem key={c} value={c}>
                        {currencyFlags[c]} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center justify-center h-9 opacity-50">
                  <HandCoinsIcon className="h-4 w-4" />
                </div>
              )}
            </SidebarMenuItem>

            {/* Language (reload by design) */}
            <SidebarMenuItem data-sidebar-interactive>
              {mounted ? (
                <Select value={lang} onValueChange={setLanguage}>
                  <SelectTrigger
                    data-sidebar-interactive
                    className={cn(
                      'w-full',
                      !open &&
                        'justify-center w-8 px-0 [&>svg:last-child]:hidden',
                    )}
                  >
                    <LanguagesIcon className="h-4 w-4 text-sidebar-foreground" />
                    {open && <span className="uppercase">{lang}</span>}
                  </SelectTrigger>

                  <SelectContent position="popper" side="top" sideOffset={8}>
                    {(['en', 'tr'] as Array<Language>).map((l) => (
                      <SelectItem key={l} value={l}>
                        {currencyFlags[l]} {l.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center justify-center h-9 opacity-50">
                  <LanguagesIcon className="h-4 w-4" />
                </div>
              )}
            </SidebarMenuItem>

            {/* Theme */}
            <SidebarMenuItem
              data-sidebar-interactive
              onClick={(e) => {
                e.stopPropagation()
                toggleTheme()
              }}
            >
              <SidebarMenuButton asChild>
                <div className="flex items-center gap-2">
                  {mounted ? (
                    isDark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )
                  ) : (
                    <div className="size-4" />
                  )}
                  <span>{t('theme_switch')}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Logout */}
            <SidebarMenuItem data-sidebar-interactive>
              <SidebarMenuButton asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!logoutMutation.isPending) {
                      logoutMutation.mutate('manual')
                    }
                  }}
                  disabled={logoutMutation.isPending}
                  className="flex items-center gap-2 w-full"
                >
                  <LucideLogOut className="h-4 w-4" />
                  <span>
                    {logoutMutation.isPending
                      ? t('logout_pending')
                      : t('logout')}
                  </span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
