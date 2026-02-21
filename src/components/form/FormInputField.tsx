import * as React from "react";
import InputField from "./InputField";
import { FormController } from "@/lib/types/types.form";

interface FormInputFieldProps<T> extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "value" | "onChange" | "form"
> {
  form: FormController<T>;
  name: keyof T;
  label: string;
}

export function FormInputField<T>({
  form,
  name,
  label,
  ...inputProps
}: FormInputFieldProps<T>) {
  const value = form.values[name];
  const error = form.fieldErrors[String(name)];

  return (
    <InputField
      name={String(name)}
      label={label}
      value={value as string | number | undefined}
      error={error}
      onChange={(e) => {
        const raw = e.target.value;

        const nextValue = typeof value === "number" ? Number(raw) : raw;

        form.setValue(name, nextValue as T[typeof name]);
      }}
      {...inputProps}
    />
  );
}
