import type { ZodError } from "zod";

// src/lib/error/utils/isZodError.ts
export function isZodError(error: unknown): error is ZodError {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as any).issues)
  );
}
