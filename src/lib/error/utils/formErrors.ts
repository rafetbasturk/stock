// src/lib/error/utils/formErrors.ts
import { I18nErrorMessage } from "../core/errorTransport";

export type FieldErrorValue = I18nErrorMessage;

export type FieldErrors = {
  [field: string]: FieldErrorValue | undefined;
  _form?: FieldErrorValue;
};
