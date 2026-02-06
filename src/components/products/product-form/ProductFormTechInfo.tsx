import * as React from "react";
import InputField from "@/components/form/InputField";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Maximize2, StickyNote } from "lucide-react";
import type { InsertProduct } from "@/types";
import { FieldErrors } from "@/lib/error/utils/formErrors";

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
  return (
    <div className="space-y-8 pb-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <FlaskConical className="size-4" />
          </div>
          <h3 className="uppercase text-xs tracking-widest text-muted-foreground/80 font-black">
            Malzeme & Süreç
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm">
          <InputField
            label="Malzeme Cinsi"
            name="material"
            value={form.material ?? ""}
            onChange={onTextChange}
            error={formErrors.material}
            placeholder="Örn: 1040 veya CK45"
            className="md:col-span-2"
          />
          <InputField
            label="Üretim İşlemleri"
            name="post_process"
            value={form.post_process ?? ""}
            onChange={onTextChange}
            error={formErrors.post_process}
            placeholder="Son işlem detayları"
          />
          <InputField
            label="Kaplama"
            name="coating"
            value={form.coating ?? ""}
            onChange={onTextChange}
            error={formErrors.coating}
            placeholder="Kaplama bilgisi"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Maximize2 className="size-4" />
          </div>
          <h3 className="uppercase text-xs tracking-widest text-muted-foreground/80 font-black">
            Boyutsal Veriler
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-5 p-4 rounded-2xl border bg-secondary/10 shadow-sm">
          <InputField
            label="Ölçü (Paylı)"
            name="specs"
            value={form.specs ?? ""}
            onChange={onTextChange}
            error={formErrors.specs}
            placeholder="Örn: Ø25x100"
          />
          <InputField
            label="Net Ölçü"
            name="specs_net"
            value={form.specs_net ?? ""}
            onChange={onTextChange}
            error={formErrors.specs_net}
            placeholder="Örn: Ø24.5x98"
          />
          <InputField
            label="Alternatif Kod"
            name="other_codes"
            value={form.other_codes ?? ""}
            onChange={onTextChange}
            error={formErrors.other_codes}
            placeholder="Muadil veya rakip kodlar"
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
            Notlar & Açıklama
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
            placeholder="Ürünle ilgili diğer özel notlar veya kalite standartları..."
          />
        </div>
      </section>
    </div>
  );
}
