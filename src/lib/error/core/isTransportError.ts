// src/lib/error/core/isTransportError.ts
import type { TransportError } from "./errorTransport";

export function isTransportError(value: unknown): value is TransportError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as any).code === "string"
  );
}
