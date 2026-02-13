import { tr } from "react-day-picker/locale";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import CustomerInput from "@/components/form/CustomerInput";
import InputField from "@/components/form/InputField";
import { Field, FieldLabel, FieldSet } from "@/components/ui/field";

interface Props {
  form: any;
  onChange: (field: string, value: any) => void;
  customerIds: number[];
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function DeliveryFormBasicInfo({
  form,
  onChange,
  customerIds,
  errors,
  setErrors,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* LEFT SIDE FIELDS */}
      <FieldSet className="w-full">
        {/* CUSTOMER SELECTION */}
        <CustomerInput
          value={form.customer_id}
          onValueChange={(val) => onChange("customer_id", val)}
          required
          label="Müşteri"
          filterIds={customerIds}
          error={errors.customer_id}
          onErrorChange={setErrors}
        />

        {/* DELIVERY NUMBER */}
        <InputField
          name="delivery_number"
          label="İrsaliye No"
          value={form.delivery_number}
          onChange={(e) => onChange("delivery_number", e.target.value)}
          required
          placeholder="NKA202500000001"
          error={errors.delivery_number}
        />

        {/* NOTES */}
        <Field className="gap-1 relative">
          <FieldLabel htmlFor="notes">Notlar</FieldLabel>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            rows={3}
          />
        </Field>
      </FieldSet>

      {/* DATE PICKER */}
      <Field className="flex flex-col gap-1 w-fit">
        <FieldLabel>Sevk Tarihi</FieldLabel>
        <Calendar
          mode="single"
          selected={form.delivery_date}
          onSelect={(date) => onChange("delivery_date", date)}
          className="rounded-md border shadow-sm w-full"
          captionLayout="label"
          locale={tr}
        />
      </Field>
    </div>
  );
}
