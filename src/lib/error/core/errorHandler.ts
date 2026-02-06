import { toast } from "sonner";
import { AppError } from "./AppError";
import { resolveError } from "./errorResolution";

interface HandleAppErrorOptions {
  clearCache?: () => void;
  isMounted?: boolean;
  forceToast?: boolean;
}

export function handleAppError(
  error: unknown,
  {
    clearCache,
    isMounted = true,
    forceToast = false,
  }: HandleAppErrorOptions = {}
) {
  if (!isMounted) return;

  const appError = AppError.from(error);
  const resolution = resolveError(appError.code);

  // 🔐 Auth / session flow
  if (resolution.requiresAuthRedirect) {
    clearCache?.();
    return;
  }

  // 🚫 Silent errors
  if (!resolution.showToast && !forceToast) return;

  // 🧩 UI effect
  toast.error(resolution.title, {
    description: appError.message,
    duration: 6000,
  });

  // 🪵 Logging (always last)
  console.error("[AppError]", appError.toLogJSON());
}
