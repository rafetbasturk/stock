import type { ErrorCode } from "./errorCodes";
import { ERROR_BEHAVIORS } from "./errorBehaviors";
import { getErrorTitle } from "./errorTitles";

export interface ErrorResolution {
  code: ErrorCode;

  /** UI */
  title: string;
  showToast: boolean;

  /** Flow control */
  requiresAuthRedirect: boolean;
}

export function resolveError(code: ErrorCode): ErrorResolution {
  const behavior = ERROR_BEHAVIORS[code] ?? {};

  return {
    code,
    title: getErrorTitle(code),
    showToast: !behavior.silent,
    requiresAuthRedirect: Boolean(behavior.requiresAuthRedirect),
  };
}
