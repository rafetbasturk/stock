import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  productId: number | undefined;
};
export default function ProductFormHeader({ productId }: Props) {
  return (
    <DialogHeader className="p-8 pb-4 border-b">
      <DialogTitle className="flex items-center gap-2">
        {productId ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
      </DialogTitle>
      <DialogDescription>
        Ürün bilgilerini doldurun ve kaydedin.{" "}
        <span className="text-red-500">*</span> işaretli alanlar zorunludur.
      </DialogDescription>
    </DialogHeader>
  );
}
