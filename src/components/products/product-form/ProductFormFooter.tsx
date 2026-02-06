import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

type Props = {
  productId: number | undefined;
  isSubmitting: boolean;
  onClose: () => void;
  hasChanged: boolean;
};

export default function ProductFormFooter({
  productId,
  isSubmitting,
  onClose,
  hasChanged,
}: Props) {
  return (
    <DialogFooter className="flex justify-end gap-2 p-8 pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isSubmitting}
      >
        İptal
      </Button>

      <Button
        type="submit"
        disabled={isSubmitting || (!!productId && !hasChanged)}
        className="disabled:cursor-not-allowed disabled:opacity-40 min-w-20"
      >
        {isSubmitting ? (
          <LoadingSpinner size="sm" variant="inline" />
        ) : productId ? (
          "Güncelle"
        ) : (
          "Ekle"
        )}
      </Button>
    </DialogFooter>
  );
}
