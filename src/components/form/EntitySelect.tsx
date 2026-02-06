import { Field, FieldError, FieldLabel } from "../ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { I18nErrorMessage } from "@/lib/error/core/errorTransport";
import { FieldErrors } from "@/lib/error/utils/formErrors";
import { useTranslation } from "react-i18next";

type Option<T extends number | string> = {
  id?: number | string;
  label: string;
  value?: string;
  returnValue?: T | null;
};

type Props<T extends number | string> = {
  /** Field name (used for error tracking, id, etc.) */
  name?: string;
  /** Label text for the field */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Currently selected value */
  value: T | null;
  /** Called when value changes */
  onValueChange: (value: T | null) => void;
  /** Error message (if any) */
  error?: I18nErrorMessage;
  /** Error setter for parent form */
  onErrorChange?: React.Dispatch<React.SetStateAction<FieldErrors>>;
  /** Whether field is required */
  required?: boolean;
  /** Whether data is still loading */
  loading?: boolean;
  /** The available options */
  options?: Option<T>[];
  /** Optional: Disable input */
  disabled?: boolean;
};

export default function EntitySelect<T extends number | string>({
  name = "entity",
  value,
  onValueChange,
  error,
  onErrorChange = () => {},
  label,
  required = false,
  loading = false,
  options = [],
  placeholder = "Bir seçim yapın",
  disabled = false,
}: Props<T>) {
  const { t } = useTranslation();
  const normalizedOptions = options.map((opt, index) => {
    const primaryValue =
      opt.value !== undefined && opt.value !== ""
        ? String(opt.value)
        : opt.id !== undefined && opt.id !== ""
          ? String(opt.id)
          : `option-${index}`;

    const key =
      opt.id !== undefined && opt.id !== ""
        ? opt.id
        : opt.value !== undefined && opt.value !== ""
          ? opt.value
          : `option-${index}`;

    return {
      option: opt,
      value: primaryValue,
      key,
    };
  });

  const handleChange = (val: string) => {
    const matchedOption = normalizedOptions.find(
      (entry) => entry.value === val,
    );

    if (!val) {
      onValueChange(null);
    } else if (
      matchedOption &&
      Object.prototype.hasOwnProperty.call(matchedOption.option, "returnValue")
    ) {
      onValueChange((matchedOption.option.returnValue ?? null) as T | null);
    } else {
      const newValue = !Number.isNaN(Number(val))
        ? (Number(val) as T)
        : (val as T);
      onValueChange(newValue);
    }

    onErrorChange((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const isDisabled = disabled || loading;

  return (
    <Field className="gap-1 relative">
      {label && (
        <FieldLabel htmlFor={name}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}

      <Select
        value={value !== null && value !== undefined ? String(value) : ""}
        onValueChange={handleChange}
        disabled={isDisabled}
      >
        <SelectTrigger
          id={name}
          aria-invalid={!!error}
          className={`border-muted bg-background hover:bg-accent font-normal text-muted-foreground {${error ? "border-red-500" : ""}`}
        >
          <SelectValue
            className="capitalize"
            placeholder={loading ? "Yükleniyor..." : placeholder}
          />
        </SelectTrigger>

        <SelectContent>
          {normalizedOptions.length > 0 ? (
            normalizedOptions.map(({ option, value: optionValue, key }) => (
              <SelectItem key={key} value={optionValue}>
                <span className="truncate">{option.label}</span>
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-muted-foreground text-sm">
              Kayıt bulunamadı
            </div>
          )}
        </SelectContent>
      </Select>

      {error && (
        <FieldError className="text-xs absolute -bottom-4.5">
          {t(`${error.i18n.ns}:${error.i18n.key}`, error.params)}
        </FieldError>
      )}
    </Field>
  );
}
