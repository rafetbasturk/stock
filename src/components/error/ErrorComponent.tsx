// src/components/error/ErrorComponent.tsx
import { ErrorMessage } from "@/components/error/ErrorMessage";
import { AppError } from "@/lib/error/core/AppError";
import { useRouter } from "@tanstack/react-router";

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
  const appError = AppError.from(error);

  /** Map common HTTP statuses to localized friendly titles */
  const titleByStatus: Record<number, string> = {
    400: "Geçersiz istek",
    401: "Yetkisiz erişim",
    403: "Erişim engellendi",
    404: "Sayfa bulunamadı",
    500: "Sunucu hatası",
  };

  const title = titleByStatus[appError.status] ?? "Bir hata oluştu";
  const message = appError.message || "Beklenmeyen bir hata meydana geldi.";

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
