import * as React from "react";
import { FlaskConical, Maximize2, StickyNote } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { InsertProduct } from "@/types";
import type { FieldErrors } from "@/lib/error/utils/formErrors";
import InputField from "@/components/form/InputField";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  form: InsertProduct;
  setForm: React.Dispatch<React.SetStateAction<InsertProduct>>;
  formErrors: FieldErrors;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ProductFormTechInfo({
  form,
  setForm,
  formErrors,
  onTextChange,
}: Props) {
  const { t } = useTranslation("entities");

  return (
    <div className="space-y-8 pb-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <FlaskConical className="size-4" />
          </div>
          <h3 className="uppercase text-xs tracking-widest text-muted-foreground/80 font-black">
            {t("products.form.sections.material_process")}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm">
          <InputField
            label={t("products.form.fields.material")}
            name="material"
            value={form.material ?? ""}
            onChange={onTextChange}
            error={formErrors.material}
            placeholder={t("products.form.placeholders.material")}
            className="md:col-span-2"
          />
          <InputField
            label={t("products.form.fields.post_process")}
            name="post_process"
            value={form.post_process ?? ""}
            onChange={onTextChange}
            error={formErrors.post_process}
            placeholder={t("products.form.placeholders.post_process")}
          />
          <InputField
            label={t("products.form.fields.coating")}
            name="coating"
            value={form.coating ?? ""}
            onChange={onTextChange}
            error={formErrors.coating}
            placeholder={t("products.form.placeholders.coating")}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Maximize2 className="size-4" />
          </div>
          <h3 className="uppercase text-xs tracking-widest text-muted-foreground/80 font-black">
            {t("products.form.sections.dimensions")}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm">
          <InputField
            label={t("products.form.fields.specs")}
            name="specs"
            value={form.specs ?? ""}
            onChange={onTextChange}
            error={formErrors.specs}
            placeholder={t("products.form.placeholders.specs")}
          />
          <InputField
            label={t("products.form.fields.specs_net")}
            name="specs_net"
            value={form.specs_net ?? ""}
            onChange={onTextChange}
            error={formErrors.specs_net}
            placeholder={t("products.form.placeholders.specs_net")}
          />
          <InputField
            label={t("products.form.fields.other_codes")}
            name="other_codes"
            value={form.other_codes ?? ""}
            onChange={onTextChange}
            error={formErrors.other_codes}
            placeholder={t("products.form.placeholders.other_codes")}
            className="md:col-span-2"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <StickyNote className="size-4" />
          </div>
          <h3 className="uppercase text-xs tracking-widest text-muted-foreground/80 font-black">
            {t("products.form.sections.notes")}
          </h3>
        </div>

        <div className="p-4 rounded-2xl border bg-secondary/10 shadow-sm">
          <Textarea
            name="notes"
            id="notes"
            rows={4}
            className="resize-none bg-background border-none shadow-inner p-3 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
            value={form.notes ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder={t("products.form.placeholders.notes")}
          />
        </div>
      </section>
    </div>
  );
}
