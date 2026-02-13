import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  deliveryId?: number;
  isSubmitting: boolean;
};

export default function DeliveryFormHeader({ deliveryId, isSubmitting }: Props) {
  return (
    <DialogHeader>
      <DialogTitle>
        {deliveryId ? "Sevki Düzenle" : "Yeni Sevk Ekle"}
        {isSubmitting && <LoadingSpinner />}
      </DialogTitle>
      <DialogDescription>
        Sevk bilgilerini doldurun ve kaydedin.{" "}
        <span className="text-red-500">*</span> işaretli alanlar zorunludur.
      </DialogDescription>
    </DialogHeader>
  );
}
