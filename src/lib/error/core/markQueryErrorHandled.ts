export function markQueryErrorHandled(error: unknown): void {
  if (typeof error === "object" && error !== null) {
    (error as any).__handledBySafeQuery = true;
  }
}
