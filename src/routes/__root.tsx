import {
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
  createRootRouteWithContext,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestHeader } from '@tanstack/react-start/server'
import { useMemo } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import type { AppSettings } from '@/lib/types'
import { AppSidebar } from '@/components/AppSidebar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorComponent } from '@/components/error/ErrorComponent'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { createI18n } from '@/lib/i18n/createI18n'
import { useErrorToast } from '@/hooks/useErrorToast'
import { useSessionPolicy } from '@/hooks/useSessionManager'
import { meQuery } from '@/lib/queries/auth'
import enRoot from '@/lib/i18n/locales/en/root.json'
import trRoot from '@/lib/i18n/locales/tr/root.json'
import { createSettingsScript } from '@/lib/settings/settingsScript'

interface MyRouterContext {
  queryClient: QueryClient
  settings: AppSettings
}

const ROOT_TITLE_BY_LANG: Record<AppSettings['lang'], string> = {
  en: enRoot.app_title,
  tr: trRoot.app_title,
}

export const getServerCookies = createServerFn().handler(() => {
  const cookieLang = getCookie('lang')
  const acceptLang = getRequestHeader('accept-language')
  const cookieTheme = getCookie('theme')
  const cookieSidebar = getCookie('sidebar_state')

  const theme: AppSettings['theme'] =
    cookieTheme === 'light' ||
    cookieTheme === 'dark' ||
    cookieTheme === 'system'
      ? cookieTheme
      : 'system'

  let lang: AppSettings['lang'] = 'tr'
  if (cookieLang === 'tr' || cookieLang === 'en') {
    lang = cookieLang
  } else if (acceptLang) {
    const primaryLang = acceptLang.split(',')[0].split('-')[0].toLowerCase()
    lang = primaryLang === 'tr' ? 'tr' : 'en'
  }

  const sidebarOpen = cookieSidebar !== 'false'

  return { lang, theme, sidebarOpen }
})

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context, location }) => {
    let user = null

    try {
      user = await context.queryClient.ensureQueryData(meQuery)
    } catch {
      user = null
    }

    const path = location.pathname
    const isPublic = path === '/login'

    if (isPublic && user) {
      throw redirect({ to: '/' })
    }

    if (!isPublic && !user) {
      throw redirect({
        to: '/login',
      })
    }

    return { user }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  loader: () => getServerCookies(),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: RootNotFound,
  pendingComponent: RootPending,
  errorComponent: ({ error, reset }) => (
    <ErrorComponent error={error} reset={reset} />
  ),
})

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAuthRoute = pathname === '/login'
  const settings = Route.useLoaderData()

  useErrorToast()
  useSessionPolicy()

  const content = isAuthRoute ? (
    <div className="min-h-svh flex items-center justify-center p-4">
      <Outlet />
    </div>
  ) : (
    <SidebarProvider defaultOpen={settings.sidebarOpen}>
      <div className="flex min-h-svh w-full">
        <AppSidebar settings={settings} />
        <main className="flex-1 overflow-hidden">
          <SidebarTrigger className="md:hidden" />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )

  return content
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const settings = Route.useLoaderData()
  const i18n = useMemo(() => createI18n(settings.lang), [settings.lang])

  return (
    <html lang={settings.lang} suppressHydrationWarning>
      <head>
        <HeadContent />
        <title>{ROOT_TITLE_BY_LANG[settings.lang]}</title>
        <ScriptOnce>{createSettingsScript(settings)}</ScriptOnce>
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          {children}
          <Toaster position="bottom-right" closeButton />
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
          <Scripts />
        </I18nextProvider>
      </body>
    </html>
  )
}

function RootPending() {
  const { t } = useTranslation('root')

  return <LoadingSpinner variant="full-page" text={t('pending')} />
}

function RootNotFound() {
  const { t } = useTranslation('root')

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-4">
      <h1 className="text-4xl font-bold">{t('not_found.code')}</h1>
      <p className="text-xl text-muted-foreground">{t('not_found.message')}</p>
      <a
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
      >
        {t('not_found.go_home')}
      </a>
    </div>
  )
}
