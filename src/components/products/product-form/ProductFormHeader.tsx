import { useTranslation } from "react-i18next";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  productId: number | undefined;
};
export default function ProductFormHeader({ productId }: Props) {
  const { t } = useTranslation("entities");

  return (
    <DialogHeader className="p-8 pb-4 border-b">
      <DialogTitle className="flex items-center gap-2">
        {productId
          ? t("products.form.header.edit")
          : t("products.form.header.create")}
      </DialogTitle>
      <DialogDescription>
        {t("products.form.header.description")}{" "}
        <span className="text-red-500">*</span>{" "}
        {t("products.form.header.required_hint")}
      </DialogDescription>
    </DialogHeader>
  );
}
