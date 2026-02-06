import * as React from "react";
import CustomerInput from "@/components/form/CustomerInput";
import EntitySelect from "@/components/form/EntitySelect";
import InputField from "@/components/form/InputField";
import PriceInput from "@/components/form/PriceInput";
import { Info, Coins, Layers2 } from "lucide-react";
import { unitArray } from "@/lib/constants";
import { formatNumberForDisplay } from "@/lib/inputUtils";
import { capitalizeTurkish } from "@/lib/utils";
import { FieldErrors } from "@/lib/error/utils/formErrors";
import type { Currency, InsertProduct } from "@/types";
import { useMemo } from "react";

type Props = {
  form: InsertProduct;
  setForm: React.Dispatch<React.SetStateAction<InsertProduct>>;
  formErrors: FieldErrors;
  setFormErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomerChange: (id: number | null) => void;
  onNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCurrencyChange: (currency: Currency) => void;
};
export default function ProductFormBasicInfo({
  form,
  setForm,
  formErrors,
  setFormErrors,
  onTextChange,
  onCustomerChange,
  onNumberChange,
  onCurrencyChange,
}: Props) {
  const unitOptions = useMemo(
    () =>
      unitArray.map((unit) => ({
        id: unit,
        label: capitalizeTurkish(unit),
      })),
    [],
  );

  return (
    <div className="space-y-8 pb-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Info className="size-4" />
          </div>
          <h3 className="uppercase text-xs tracking-widest text-muted-foreground/80 font-black">
            Kimlik & Tanımlama
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm">
          <div className="md:col-span-4">
            <InputField
              label="Ürün Kodu"
              name="code"
              value={form.code ?? ""}
              onChange={onTextChange}
              error={formErrors.code}
              required
              placeholder="KOD-001"
              autoComplete="off"
              className="font-mono"
            />
          </div>
          <div className="md:col-span-8">
            <InputField
              label="Ürün Adı"
              name="name"
              value={form.name ?? ""}
              onChange={onTextChange}
              error={formErrors.name}
              required
              placeholder="Ürünün tam başlığı"
              autoComplete="off"
            />
          </div>
          <div className="md:col-span-12">
            <CustomerInput
              value={form.customer_id}
              onValueChange={onCustomerChange}
              error={formErrors.customer}
              onErrorChange={setFormErrors}
              label="Müşteri Portföyü"
              required
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Coins className="size-4" />
          </div>
          <h3 className="uppercase text-xs tracking-widest text-muted-foreground/80 font-black">
            Finans & Birim
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm items-end">
          <PriceInput
            name="price"
            label="Satış Fiyatı"
            price={form.price ?? 0}
            currency={form.currency || "TRY"}
            onPriceChange={onNumberChange}
            onCurrencyChange={onCurrencyChange}
            error={formErrors.price}
          />
          <EntitySelect
            name="unit"
            label="Stok Birimi"
            value={form.unit || unitArray[0]}
            onValueChange={(value) =>
              setForm((prev: any) => ({
                ...prev,
                unit: value as (typeof unitArray)[number],
              }))
            }
            options={unitOptions}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Layers2 className="size-4" />
          </div>
          <h3 className="uppercase text-xs tracking-widest text-muted-foreground/80 font-black">
            Stok Yönetimi
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm">
          <InputField
            label="Mevcut Stok"
            name="stock_quantity"
            type="text"
            inputMode="numeric"
            value={formatNumberForDisplay(form.stock_quantity)}
            onChange={onNumberChange}
            error={formErrors.stock_quantity}
            placeholder="0"
            autoComplete="off"
            className="text-center font-bold"
          />

          <InputField
            label="Kritik Seviye"
            name="min_stock_level"
            type="text"
            inputMode="numeric"
            value={formatNumberForDisplay(form.min_stock_level)}
            onChange={onNumberChange}
            error={formErrors.min_stock_level}
            placeholder="0"
            autoComplete="off"
            className="text-center text-red-500 font-bold"
          />
        </div>
      </section>
    </div>
  );
}
