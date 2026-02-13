import * as React from "react";
import { Coins, Info, Layers2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { FieldErrors } from "@/lib/error/utils/formErrors";
import type { Currency, InsertProduct } from "@/types";
import CustomerInput from "@/components/form/CustomerInput";
import EntitySelect from "@/components/form/EntitySelect";
import InputField from "@/components/form/InputField";
import PriceInput from "@/components/form/PriceInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { unitArray } from "@/lib/constants";
import { formatNumberForDisplay } from "@/lib/inputUtils";
import { capitalizeTurkish } from "@/lib/utils";

type StockActionType = "IN" | "OUT";

type Props = {
  form: InsertProduct;
  setForm: React.Dispatch<React.SetStateAction<InsertProduct>>;
  formErrors: FieldErrors;
  setFormErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomerChange: (id: number | null) => void;
  onNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCurrencyChange: (currency: Currency) => void;
  isEditing: boolean;
  stockAction: {
    type: StockActionType;
    quantity: string;
    notes: string;
  };
  onStockActionTypeChange: (type: StockActionType) => void;
  onStockActionQuantityChange: (quantity: string) => void;
  onStockActionNotesChange: (notes: string) => void;
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
  isEditing,
  stockAction,
  onStockActionTypeChange,
  onStockActionQuantityChange,
  onStockActionNotesChange,
}: Props) {
  const { t } = useTranslation(["entities", "stock"]);

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
            {t("products.form.sections.identity", { ns: "entities" })}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm">
          <div className="md:col-span-4">
            <InputField
              label={t("products.form.fields.code", { ns: "entities" })}
              name="code"
              value={form.code}
              onChange={onTextChange}
              error={formErrors.code}
              required
              placeholder={t("products.form.placeholders.code", {
                ns: "entities",
              })}
              autoComplete="off"
              className="font-mono"
            />
          </div>
          <div className="md:col-span-8">
            <InputField
              label={t("products.form.fields.name", { ns: "entities" })}
              name="name"
              value={form.name}
              onChange={onTextChange}
              error={formErrors.name}
              required
              placeholder={t("products.form.placeholders.name", {
                ns: "entities",
              })}
              autoComplete="off"
            />
          </div>
          <div className="md:col-span-12">
            <CustomerInput
              value={form.customer_id}
              onValueChange={onCustomerChange}
              error={formErrors.customer}
              onErrorChange={setFormErrors}
              label={t("products.form.fields.customer", { ns: "entities" })}
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
            {t("products.form.sections.finance", { ns: "entities" })}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm items-end">
          <PriceInput
            name="price"
            label={t("products.form.fields.price", { ns: "entities" })}
            price={form.price ?? 0}
            currency={form.currency || "TRY"}
            onPriceChange={onNumberChange}
            onCurrencyChange={onCurrencyChange}
            error={formErrors.price}
          />
          <EntitySelect
            name="unit"
            label={t("products.form.fields.unit", { ns: "entities" })}
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
            {t("products.form.sections.stock", { ns: "entities" })}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm">
          <InputField
            label={
              isEditing
                ? t("products.form.fields.current_stock_readonly", {
                    ns: "entities",
                  })
                : t("products.form.fields.initial_stock", { ns: "entities" })
            }
            name="stock_quantity"
            type="text"
            inputMode="numeric"
            value={formatNumberForDisplay(form.stock_quantity)}
            onChange={onNumberChange}
            error={formErrors.stock_quantity}
            placeholder="0"
            autoComplete="off"
            className="text-center font-bold"
            readOnly={isEditing}
          />

          <InputField
            label={t("products.form.fields.min_stock", { ns: "entities" })}
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

        {isEditing && (
          <div className="space-y-4 p-4 rounded-2xl border bg-background shadow-sm">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">
                {t("products.form.stock_action.title", { ns: "entities" })}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("products.form.stock_action.description", {
                  ns: "entities",
                })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={stockAction.type === "IN" ? "default" : "outline"}
                className="flex-1"
                onClick={() => onStockActionTypeChange("IN")}
              >
                {t("stock_in", { ns: "stock" })}
              </Button>
              <Button
                type="button"
                variant={stockAction.type === "OUT" ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => onStockActionTypeChange("OUT")}
              >
                {t("stock_out", { ns: "stock" })}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock-action-quantity">
                {t("products.form.stock_action.quantity", { ns: "entities" })}
              </Label>
              <input
                id="stock-action-quantity"
                type="number"
                min={1}
                step={1}
                value={stockAction.quantity}
                onChange={(e) => onStockActionQuantityChange(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                placeholder={t("products.form.placeholders.quantity", {
                  ns: "entities",
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock-action-notes">
                {t("products.form.stock_action.notes", { ns: "entities" })}
              </Label>
              <Textarea
                id="stock-action-notes"
                value={stockAction.notes}
                onChange={(e) => onStockActionNotesChange(e.target.value)}
                placeholder={t("products.form.placeholders.stock_action_notes", {
                  ns: "entities",
                })}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
