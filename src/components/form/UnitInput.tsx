import { unitArray } from "@/lib/constants";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  unit: (typeof unitArray)[number];
  setValue: React.Dispatch<React.SetStateAction<any>>;
  label?: string
};
export default function UnitInput({ unit, setValue, label }: Props) {
  return (
    <SelectGroup className={`${label && "space-y-1"}`}>
      {label && <Label className="flex">Birim</Label>}
      <Select
        name="unit"
        value={unit ?? unitArray[0]}
        onValueChange={(value) =>
          setValue((prev: any) => ({
            ...prev,
            unit: value as (typeof unitArray)[number],
          }))
        }
      >
        <SelectTrigger id="unit" className="capitalize">
          <SelectValue placeholder="Birim seçin" />
        </SelectTrigger>
        <SelectContent>
          {unitArray.map((unit) => (
            <SelectItem key={unit} value={String(unit)} className="capitalize">
              {unit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SelectGroup>
  );
}
