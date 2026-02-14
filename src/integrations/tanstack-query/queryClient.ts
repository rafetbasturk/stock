// src/lib/queryClient.tsx
import { QueryClient } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
    },
  });
}

export function getQueryClient() {
  const queryClient =
    typeof window === "undefined"
      ? makeQueryClient()
      : (browserQueryClient ??= makeQueryClient());

  return { queryClient };
}
