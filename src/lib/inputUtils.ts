import { FieldErrors } from "./error/utils/formErrors";

export const formatNumberForDisplay = (
  value: number | string | undefined | null,
  decimalSeparator: "," | "." = ",",
): string => {
  if (value === undefined || value === null || value === 0) return "";
  if (typeof value === "string") return value;

  // Convert number to string with specified decimal separator
  return value.toString().replace(".", decimalSeparator);
};

export const convertFormValueToNumber = (
  value: string | number | undefined | null,
  decimalSeparator: "," | "." = ",",
): number => {
  if (value === undefined || value === null) return 0;
  const stringValue = String(value)
    .replace(/\./g, "")
    .replace(decimalSeparator, ".");
  return parseFloat(stringValue) || 0;
};

export interface NumberInputOptions {
  allowNegative?: boolean;
  allowDecimal?: boolean;
  maxDecimalPlaces?: number;
  decimalSeparator?: "," | ".";
}

export interface NumberInputResult {
  isValid: boolean;
  cleanedValue: string;
  numericValue: number | null;
}

/**
 * Validates and formats number input with comma as decimal separator
 */
export const validateNumberInput = (
  value: string,
  options: NumberInputOptions = {},
): NumberInputResult => {
  const {
    allowNegative = false,
    allowDecimal = false,
    maxDecimalPlaces = 2,
    decimalSeparator = ",",
  } = options;

  // Allow empty value
  if (value === "") {
    return { isValid: true, cleanedValue: "", numericValue: null };
  }

  // Escape the decimal separator for regex
  const escapedSeparator = decimalSeparator === "." ? "\\." : decimalSeparator;

  // Build regex pattern based on options
  let pattern = "^";
  if (allowNegative) pattern += "-?";
  pattern += "\\d*";
  if (allowDecimal)
    pattern += `(${escapedSeparator}\\d{0,${maxDecimalPlaces}})?`;
  pattern += "$";

  const regex = new RegExp(pattern);

  if (!regex.test(value)) {
    return { isValid: false, cleanedValue: value, numericValue: null };
  }

  // Convert to numeric value (replace comma with dot for JavaScript)
  const numericValue = parseFloat(value.replace(decimalSeparator, "."));

  return {
    isValid: true,
    cleanedValue: value,
    numericValue: isNaN(numericValue) ? null : numericValue,
  };
};

/**
 * Creates a number input change handler for React forms
 */
export const createNumberInputHandler = (
  setForm: React.Dispatch<React.SetStateAction<any>>,
  setFormErrors?: React.Dispatch<React.SetStateAction<FieldErrors>>,
  options: NumberInputOptions = {},
) => {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const fieldOptions = {
      // Default options can be overridden per field
      allowDecimal: name === "price", // Price fields typically need decimals
      maxDecimalPlaces: name === "price" ? 2 : 0, // Price: 2 decimals, others: 0
      ...options,
    };

    const result = validateNumberInput(value, fieldOptions);

    if (result.isValid) {
      setForm((prev: any) => ({
        ...prev,
        [name]: value === "" ? undefined : value,
      }));

      // Clear error when user starts typing
      if (setFormErrors && result.cleanedValue !== "") {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };
};
