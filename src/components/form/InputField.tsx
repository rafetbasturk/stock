// src/components/form/InputField.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import type { I18nErrorMessage } from "@/lib/error/core/errorTransport";
import { cn } from "@/lib/utils";

/**
 * Extend native input props but keep control over
 * value, onChange, and name
 */
interface InputFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "name"
> {
  name: string;
  label?: string;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: I18nErrorMessage;
}

export default function InputField({
  name,
  label,
  value,
  onChange,
  required = false,
  error,
  className,
  ...inputProps
}: InputFieldProps) {
  const { t } = useTranslation();

  return (
    <Field className="gap-1 relative">
      {label && (
        <FieldLabel
          htmlFor={name}
          className={cn("capitalize", error && "text-red-500")}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}

      <Input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={!!error}
        {...inputProps}
        className={cn(error && "border-red-500", className)}
      />

      {error && (
        <FieldError className="text-xs absolute -bottom-4.5">
          {t(`${error.i18n.ns}:${error.i18n.key}`, error.params)}
        </FieldError>
      )}
    </Field>
  );
}
