// src/components/error/ErrorComponent.tsx
import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ErrorMessage } from "@/components/error/ErrorMessage";
import { AppError } from "@/lib/error/core/AppError";

interface ErrorComponentProps {
  error: unknown;
  reset?: () => void; // TanStack Router provides this optionally
}

/**
 * Unified TanStack Router error component.
 * Handles both route and global loader/mutation errors.
 */
export function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const { t } = useTranslation("errors");
  const appError = AppError.from(error);

  const titleKeyByStatus: Record<number, string> = {
    400: "titles.bad_request",
    401: "titles.unauthorized",
    403: "titles.forbidden",
    404: "titles.not_found",
    500: "titles.internal_server_error",
  };

  const title = t(
    titleKeyByStatus[appError.status] ?? "titles.unexpected"
  );
  const message = appError.message || t("messages.unexpected");

  function handleReset() {
    if (reset) {
      // ✅ TanStack Router reset (reloads current route loader)
      reset();
    } else {
      // Fallback: navigate home or reload
      router.navigate({
        to: router.state.location.pathname,
        replace: true,
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <ErrorMessage
        title={title}
        message={message}
        onRouterReset={handleReset}
        showBackButton
      />
    </div>
  );
}
