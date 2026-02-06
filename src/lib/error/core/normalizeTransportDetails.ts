// src/lib/error/core/normalizeTransportDetails.ts
import type { TransportError, ValidationErrorPayload } from "./errorTransport";

export function normalizeTransportDetails(
  payload: TransportError
): string | ValidationErrorPayload | undefined {
  if ("details" in payload && payload.details) {
    if (payload.details.type === "text") {
      return payload.details.value;
    }

    if (payload.details.type === "unknown") {
      return undefined;
    }

    // ValidationErrorPayload
    return payload.details;
  }

  return undefined;
}
