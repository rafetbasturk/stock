import type { FieldErrors } from "./error/utils/formErrors";

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
  const stringValue = String(value);
  return parseLocaleNumber(stringValue, decimalSeparator);
};

export const parseLocaleNumber = (
  value: string,
  decimalSeparator: "," | "." = ",",
): number => {
  const cleaned = value
    .trim()
    .replace(/\s|\u00A0/g, "")
    .replace(/[’']/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const hasComma = lastComma >= 0;
  const hasDot = lastDot >= 0;

  if (!hasComma && !hasDot) {
    return Number(cleaned) || 0;
  }

  let normalized = cleaned;

  if (hasComma && hasDot) {
    const decimalChar = lastComma > lastDot ? "," : ".";
    const thousandsChar = decimalChar === "," ? "." : ",";
    normalized = normalized.split(thousandsChar).join("");
    normalized = normalized.replace(decimalChar, ".");
    return Number(normalized) || 0;
  }

  const singleSep = hasComma ? "," : ".";
  const sepIndex = hasComma ? lastComma : lastDot;
  const digitsAfter = cleaned.length - sepIndex - 1;
  const sepCount = (cleaned.match(new RegExp(`\\${singleSep}`, "g")) ?? [])
    .length;

  // If we only have thousand-group-like separators, collapse them.
  if (
    digitsAfter === 3 &&
    decimalSeparator !== singleSep &&
    sepCount >= 1
  ) {
    normalized = cleaned.split(singleSep).join("");
    return Number(normalized) || 0;
  }

  normalized = cleaned.replace(singleSep, ".");
  if (sepCount > 1) {
    const first = normalized.indexOf(".");
    normalized =
      normalized.slice(0, first + 1) +
      normalized.slice(first + 1).replace(/\./g, "");
  }

  return Number(normalized) || 0;
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

  const compact = value.replace(/\s|\u00A0/g, "");
  const baseRegex = allowNegative ? /^-?[\d.,]*$/ : /^[\d.,]*$/;
  if (!baseRegex.test(compact)) {
    return { isValid: false, cleanedValue: value, numericValue: null };
  }

  let cleanedValue = compact;

  if (allowDecimal) {
    const lastComma = cleanedValue.lastIndexOf(",");
    const lastDot = cleanedValue.lastIndexOf(".");
    const decimalIndex = Math.max(lastComma, lastDot);

    if (decimalIndex >= 0) {
      const intPart = cleanedValue
        .slice(0, decimalIndex)
        .replace(/[.,]/g, "");
      const fracPart = cleanedValue
        .slice(decimalIndex + 1)
        .replace(/[.,]/g, "")
        .slice(0, maxDecimalPlaces);

      const sourceDigitsAfter = cleanedValue.length - decimalIndex - 1;
      const onlyOneSepKind =
        (lastComma >= 0 && lastDot < 0) || (lastDot >= 0 && lastComma < 0);

      // Likely thousand separator (e.g., 1.234 or 1,234)
      if (onlyOneSepKind && sourceDigitsAfter === 3 && maxDecimalPlaces <= 2) {
        cleanedValue = cleanedValue.replace(/[.,]/g, "");
      } else {
        const sep = decimalSeparator;
        cleanedValue =
          fracPart.length > 0 || /[.,]$/.test(cleanedValue)
            ? `${intPart || "0"}${sep}${fracPart}`
            : intPart;
      }
    } else {
      cleanedValue = cleanedValue.replace(/[.,]/g, "");
    }
  } else {
    cleanedValue = cleanedValue.replace(/[.,]/g, "");
  }

  const numericValue = parseLocaleNumber(cleanedValue, decimalSeparator);

  return {
    isValid: true,
    cleanedValue,
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
