// src/lib/queries.ts
import {  queryOptions } from '@tanstack/react-query'
import type {QueryClient} from '@tanstack/react-query';
import { authMe } from '@/server/auth'

export const meQuery = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => authMe(),
  staleTime: 60_000,
  retry: false,
})

export function clearAuth(queryClient: QueryClient) {
  queryClient.setQueryData(['auth', 'me'], null)
}
