import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppError } from "@/lib/error/core/AppError";
import { meQuery } from "@/lib/queries/auth";
import { useLogoutMutation } from "@/lib/mutations/auth";

const SESSION_POLICY = {
  inactivityLimitMs: 15 * 60 * 1000,
  warningBeforeMs: 60 * 1000,
  heartbeatIntervalMs: 60 * 1000 + Math.random() * 10 * 1000,
};

export function useSessionPolicy() {
  const logout = useLogoutMutation();

  const inactivityTimer = useRef<number | null>(null);
  const warningTimer = useRef<number | null>(null);
  const warningShown = useRef(false);

  const { data: me, error } = useQuery({
    ...meQuery,
    refetchInterval: SESSION_POLICY.heartbeatIntervalMs,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!me;

  /* ---------------------------
   * 1️⃣ Client inactivity + warning
   * --------------------------- */
  useEffect(() => {
    if (!isAuthenticated) return;

    const clearTimers = () => {
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
      }
      if (warningTimer.current) {
        window.clearTimeout(warningTimer.current);
      }
    };

    const resetTimers = () => {
      clearTimers();
      warningShown.current = false;

      // 🔔 Warning timer
      warningTimer.current = window.setTimeout(() => {
        if (warningShown.current) return;

        warningShown.current = true;

        toast.warning(
          "Your session will expire in 1 minute due to inactivity.",
          {
            id: "session-expiring",
            closeButton: true,
            duration: SESSION_POLICY.warningBeforeMs,
          }
        );
      }, SESSION_POLICY.inactivityLimitMs - SESSION_POLICY.warningBeforeMs);

      // 🚪 Logout timer
      inactivityTimer.current = window.setTimeout(() => {
        if (!logout.isPending) {
          logout.mutate("inactivity");
        }
      }, SESSION_POLICY.inactivityLimitMs);
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach((e) => window.addEventListener(e, resetTimers));
    resetTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimers));
      clearTimers();
    };
  }, [isAuthenticated, logout]);

  /* ---------------------------
   * 2️⃣ Server session expiry
   * --------------------------- */
  useEffect(() => {
    if (!error) return;

    const appError = AppError.from(error);

    if (appError.code === "SESSION_INVALID") {
      logout.mutate("session-expired");
    }
  }, [error, logout]);
}
