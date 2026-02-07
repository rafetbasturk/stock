// src/lib/error/core/zodToValidationPayload.ts
import type { ZodError } from "zod";
import type {
  I18nErrorMessage,
  ValidationErrorPayload,
} from "./errorTransport";

function mapZodIssue(issue: ZodError["issues"][number]): I18nErrorMessage {
  switch (issue.code) {
    case "too_small":
      return {
        i18n: { ns: "validation", key: "min_length" },
        params: { min: Number(issue.minimum) },
      };

    case "too_big":
      return {
        i18n: { ns: "validation", key: "max_length" },
        params: { max: Number(issue.maximum) },
      };

    case "invalid_type":
      return {
        i18n: { ns: "validation", key: "required" },
      };

    case "invalid_format":
      return {
        i18n: { ns: "validation", key: "invalid_format" },
      };

    case "not_multiple_of":
      return {
        i18n: { ns: "validation", key: "not_multiple_of" },
        params: { multiple: Number((issue as any).multipleOf) },
      };

    default:
      return {
        i18n: { ns: "validation", key: "invalid" },
      };
  }
}

export function zodToValidationPayload(
  error: ZodError
): ValidationErrorPayload {
  const fieldErrors: ValidationErrorPayload["fieldErrors"] = {};

  for (const issue of error.issues) {
    const field = issue.path.join(".");
    if (Object.prototype.hasOwnProperty.call(fieldErrors, field)) continue;

    fieldErrors[field] = mapZodIssue(issue);
  }

  return {
    type: "validation",
    fieldErrors,
  };
}
