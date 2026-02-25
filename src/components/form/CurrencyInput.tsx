import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { Currency } from "@/types";
import { currencyArray } from "@/lib/currency";

type Props = {
  value: Currency;
  onChange: (value: Currency) => void;
  label?: boolean;
  labelText?: string;
};
export default function CurrencyInput({
  value,
  onChange,
  label = false,
  labelText = "Para Birimi",
}: Props) {
  return (
    <div className="space-y-1">
      {label && <Label className="flex">{labelText}</Label>}
      <SelectGroup>
        <Select value={value as string} onValueChange={onChange}>
          <SelectTrigger
            id="currency"
            className="border-0 rounded-l-none  border-l shadow-none"
          >
            <SelectValue placeholder="Para birimini seçin" />
          </SelectTrigger>
          <SelectContent align="end">
            {currencyArray.map((currency) => (
              <SelectItem key={currency} value={String(currency)}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SelectGroup>
    </div>
  );
}
