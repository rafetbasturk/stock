// src/lib/error/core/isTransportError.ts
import { isErrorCode } from "../utils/isErrorCode";
import type { TransportError } from "./errorTransport";

export function isTransportError(value: unknown): value is TransportError {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as any;
  const code = candidate.code;

  if (!isErrorCode(code)) return false;
  if (
    "message" in candidate &&
    candidate.message !== undefined &&
    typeof candidate.message !== "string"
  ) {
    return false;
  }

  if (code === "VALIDATION_ERROR") {
    const details = candidate.details;
    return (
      typeof details === "object" &&
      details !== null &&
      details.type === "validation" &&
      typeof details.fieldErrors === "object" &&
      details.fieldErrors !== null
    );
  }

  if (!("details" in candidate) || candidate.details === undefined) {
    return true;
  }

  const details = candidate.details;
  if (typeof details !== "object" || details === null) return false;

  if (details.type === "unknown") return true;
  if (details.type === "text" && typeof details.value === "string") return true;

  return false;
}
