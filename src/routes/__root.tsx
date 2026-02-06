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

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestHeader } from '@tanstack/react-start/server'
import type { AppSettings } from '@/lib/types'
import { useMemo } from 'react'
import { createI18n } from '@/lib/i18n/createI18n'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { I18nextProvider } from 'react-i18next'
import { createSettingsScript } from '@/lib/settings/settingsScript'
import { meQuery } from '@/lib/queries/auth'
import { useErrorToast } from '@/hooks/useErrorToast'
import { useSessionPolicy } from '@/hooks/useSessionManager'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorComponent } from '@/components/error/ErrorComponent'
import { Toaster } from 'sonner'

interface MyRouterContext {
  queryClient: QueryClient
  settings: AppSettings
}

export const getServerCookies = createServerFn().handler(async () => {
  const cookieLang = getCookie('lang')
  const acceptLang = getRequestHeader('accept-language')
  const theme = getCookie('theme') || 'system'

  let lang = 'tr'
  if (cookieLang === 'tr' || cookieLang === 'en') {
    lang = cookieLang
  } else if (acceptLang) {
    const primaryLang = acceptLang.split(',')[0].split('-')[0].toLowerCase()
    lang = primaryLang === 'en' ? 'en' : 'tr'
  }

  return { lang, theme }
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
    const isPublic = path === '/login' || path === '/signup'

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
      {
        title: 'Stok-Sipariş Takip Uygulaması',
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
  notFoundComponent: () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">
          Aradığınız sayfa bulunamadı.
        </p>
        <a
          href="/"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    )
  },
  pendingComponent: () => <LoadingSpinner variant="full-page" text="__root" />,
  errorComponent: ({ error, reset }) => (
    <ErrorComponent error={error} reset={reset} />
  ),
})

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const settings = Route.useLoaderData() as AppSettings
  const i18n = useMemo(() => createI18n(settings.lang), [settings.lang])

  useErrorToast()
  useSessionPolicy()

  const content = isAuthRoute ? (
    <div className="min-h-svh flex items-center justify-center p-4">
      <Outlet />
    </div>
  ) : (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-svh w-full">
        <AppSidebar settings={settings} />
        <main className="flex-1 overflow-hidden">
          <SidebarTrigger className="md:hidden" />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )

  return <I18nextProvider i18n={i18n}>{content}</I18nextProvider>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const settings = Route.useLoaderData() ?? {
    lang: 'tr',
    theme: 'system',
  }

  return (
    <html lang={settings.lang} suppressHydrationWarning>
      <head>
        <HeadContent />
        <ScriptOnce>{createSettingsScript(settings)}</ScriptOnce>
      </head>
      <body>
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
      </body>
    </html>
  )
}
