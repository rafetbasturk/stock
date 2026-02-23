import {
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
  createRootRouteWithContext,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
// import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
// import { TanStackDevtools } from '@tanstack/react-devtools'
// import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { createServerFn } from '@tanstack/react-start'
import { useMemo } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
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
import { ClientOnly } from '@tanstack/react-router'
import { SetTimeZoneCookie } from '@/components/SetTimeZoneCookie'
import type { AppSettings, Language } from '@/lib/types/types.settings'
import { settingsMiddleware } from '@/middleware/settings'

interface MyRouterContext {
  queryClient: QueryClient
  settings: AppSettings
}

const ROOT_TITLE_BY_LANG: Record<Language, string> = {
  en: enRoot.app_title,
  tr: trRoot.app_title,
}

export const getServerCookies = createServerFn()
  .middleware([settingsMiddleware])
  .handler(async ({ context }) => {
    return context.settings
  })

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context, location }) => {
    const settings = await getServerCookies()

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

    return { user, settings }
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
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: RootNotFound,
  pendingComponent: RootPending,
  errorComponent: ({ error, reset }) => (
    <ErrorComponent error={error} reset={reset} />
  ),
})

function RootComponent() {
  const { settings } = Route.useRouteContext()
  const matches = useRouterState({ select: (s) => s.matches })
  const isAuthLayout = matches.some((m) => m.routeId === '/_auth')

  useErrorToast()
  useSessionPolicy()

  const content = isAuthLayout ? (
    <div className="min-h-svh flex items-center justify-center p-4">
      <Outlet />
    </div>
  ) : (
    <SidebarProvider defaultOpen={settings.sidebarOpen}>
      <div className="flex min-h-svh w-full">
        <AppSidebar settings={settings} />
        <main className="flex-1 overflow-x-hidden">
          <SidebarTrigger className="md:hidden" />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )

  return content
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { settings } = Route.useRouteContext()

  const i18n = useMemo(() => createI18n(settings.lang), [settings.lang])

  return (
    <html lang={settings.lang}>
      <head>
        <HeadContent />
        <title>{ROOT_TITLE_BY_LANG[settings.lang]}</title>
        <ScriptOnce>{createSettingsScript(settings)}</ScriptOnce>
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          <ClientOnly fallback={null}>
            <SetTimeZoneCookie />
          </ClientOnly>
          {children}
          <Toaster position="bottom-right" closeButton />
          {/* <ClientOnly>
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
          </ClientOnly> */}
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
