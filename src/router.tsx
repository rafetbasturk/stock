// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { QueryClientProvider } from '@tanstack/react-query'

import { routeTree } from './routeTree.gen'
import { AppProviders } from './integrations/app-providers'
import { getQueryClient } from './integrations/tanstack-query/queryClient'

export const getRouter = () => {
  const { queryClient } = getQueryClient()

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      settings: undefined!,
    },
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <AppProviders>{children}</AppProviders>
      </QueryClientProvider>
    ),
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    wrapQueryClient: false,
  })

  return router
}
