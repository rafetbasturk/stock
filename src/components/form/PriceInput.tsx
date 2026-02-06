import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../ui/input-group";
import type { Currency } from "@/types";
import CurrencyInput from "./CurrencyInput";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { formatNumberForDisplay } from "@/lib/inputUtils";
import { I18nErrorMessage } from "@/lib/error/core/errorTransport";
import { useTranslation } from "react-i18next";

type Props = {
  name: string;
  label?: string;
  required?: boolean;
  price: number;
  currency: Currency;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCurrencyChange?: (value: Currency) => void;
  error?: I18nErrorMessage;
  showCurrencySymbol?: boolean;
  showCurrencySelect?: boolean;
  currencySelectWidth?: string;
};
export default function PriceInput({
  name,
  label,
  required = false,
  price,
  currency,
  onPriceChange,
  onCurrencyChange = () => {},
  error,
  showCurrencySymbol = true,
  showCurrencySelect = true,
  currencySelectWidth = "",
}: Props) {
  const { t } = useTranslation();
  const getCurrencySymbol = (curr: Currency) => {
    switch (curr) {
      case "EUR":
        return "€";
      case "USD":
        return "$";
      case "TRY":
        return "₺";
      default:
        return curr;
    }
  };

  return (
    <Field className="gap-1 relative">
      {label && (
        <FieldLabel htmlFor={name}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}
      <InputGroup>
        {/* Currency Sign */}
        {showCurrencySymbol && (
          <InputGroupAddon>
            <InputGroupText>{getCurrencySymbol(currency)}</InputGroupText>
          </InputGroupAddon>
        )}
        {/* Price */}
        <InputGroupInput
          name={name}
          id={name}
          type="text"
          inputMode="decimal"
          value={formatNumberForDisplay(price)}
          onChange={onPriceChange}
          placeholder="0,00"
        />
        {/* Currency */}
        {showCurrencySelect && (
          <InputGroupAddon
            align="inline-end"
            className={`p-0 ${currencySelectWidth}`}
          >
            <CurrencyInput value={currency} onChange={onCurrencyChange} />
          </InputGroupAddon>
        )}
      </InputGroup>
      {error && (
        <FieldError className="text-xs absolute -bottom-4.5">
          {t(`${error.i18n.ns}:${error.i18n.key}`, error.params)}
        </FieldError>
      )}
    </Field>
  );
}
