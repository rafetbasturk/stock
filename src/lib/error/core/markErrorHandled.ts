export function markErrorHandled(error: unknown): void {
  if (typeof error === "object" && error !== null) {
    (error as any).__handledBySafeMutation = true;
  }
}
