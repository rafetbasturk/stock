import { FieldErrors } from "@/lib/error/utils/formErrors";
import { useTranslation } from "react-i18next";

export function useFormErrorMessage(errors: FieldErrors): string | null {
  const { t } = useTranslation();
  const error = errors._form;
  if (!error) return null;

  return t(`${error.i18n.ns}:${error.i18n.key}`, error.params);
}
