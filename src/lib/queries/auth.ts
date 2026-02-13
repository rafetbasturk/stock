// src/lib/queries.ts
import { authMe } from '@/server/auth'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

export const meQuery = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => authMe(),
  staleTime: 60_000,
  retry: false,
})

export function clearAuth(queryClient: QueryClient) {
  queryClient.setQueryData(['auth', 'me'], null)
}
