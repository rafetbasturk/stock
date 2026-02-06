// src/hooks/useErrorToast.ts
import { useEffect, useRef } from "react";
import {
  useQueryClient,
  type QueryCacheNotifyEvent,
  type MutationCacheNotifyEvent,
} from "@tanstack/react-query";
import { AppError, handleAppError } from "@/lib/error/core";
import { clearAuth } from "@/lib/queries/auth";
import { useLogoutMutation } from "@/lib/mutations/auth";

/**
 * useErrorToast
 * --------------
 * Global async error listener for React Query.
 *
 * Design rules:
 * - Local handlers MUST explicitly mark errors as handled.
 * - Global handler NEVER deduplicates by error content.
 * - Optional time-based throttling prevents toast storms.
 */
export function useErrorToast() {
  const queryClient = useQueryClient();
  const logoutMutation = useLogoutMutation();

  // Soft throttle to avoid toast storms (e.g. refetch loops)
  const lastToastAt = useRef<number>(0);
  const TOAST_THROTTLE_MS = 500;

  useEffect(() => {
    let isMounted = true;

    const handleGlobalError = (
      error: unknown,
      source: "query" | "mutation"
    ) => {
      if (!isMounted) return;

      // 🚫 Explicitly locally handled → never show toast
      if ((error as any)?.__handledBySafeMutation) return;
      if ((error as any)?.__handledBySafeQuery) return;

      const appError = AppError.from(error);

      // 🔐 Session / auth errors → unified logout flow
      if (
        appError.code === "SESSION_INVALID" ||
        appError.code === "UNAUTHORIZED" ||
        appError.code === "AUTH_HEADER_MISSING" ||
        appError.code === "REFRESH_TOKEN_MISSING"
      ) {
        logoutMutation.mutate("session-expired");
        return;
      }

      // ⏱️ Soft throttle (time-based, not content-based)
      const now = Date.now();
      if (now - lastToastAt.current < TOAST_THROTTLE_MS) return;
      lastToastAt.current = now;

      // 🧩 Delegate to declarative handler
      handleAppError(error, {
        clearCache: () => clearAuth(queryClient),
        isMounted,
      });

      // 🪵 Dev diagnostics
      if (process.env.NODE_ENV === "development") {
        window.dispatchEvent(
          new CustomEvent("AppErrorHandled", {
            detail: {
              source,
              code: appError.code,
              error,
            },
          })
        );
      }
    };

    // 🔍 Query errors
    const unsubscribeQueries = queryClient
      .getQueryCache()
      .subscribe((event: QueryCacheNotifyEvent) => {
        if (event.type === "updated" && event.query.state.error) {
          handleGlobalError(event.query.state.error, "query");
        }
      });

    // 🔍 Mutation errors
    const unsubscribeMutations = queryClient
      .getMutationCache()
      .subscribe((event: MutationCacheNotifyEvent) => {
        if (event.type === "updated" && event.mutation.state.error) {
          handleGlobalError(event.mutation.state.error, "mutation");
        }
      });

    return () => {
      isMounted = false;
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [queryClient, logoutMutation]);
}
