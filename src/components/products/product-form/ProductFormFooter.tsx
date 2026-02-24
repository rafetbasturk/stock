import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useMobileReadonly } from "@/hooks/useMobileReadonly";

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
  const { t } = useTranslation("entities");
  const isMobileReadonly = useMobileReadonly();

  return (
    <DialogFooter className="flex justify-end gap-2 p-8 pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isSubmitting}
      >
        {t("products.form.buttons.cancel")}
      </Button>

      <Button
        type="submit"
        disabled={isSubmitting || (!!productId && !hasChanged) || isMobileReadonly}
        className="disabled:cursor-not-allowed disabled:opacity-40 min-w-20"
      >
        {isSubmitting ? (
          <LoadingSpinner size="sm" variant="inline" />
        ) : productId ? (
          t("products.form.buttons.update")
        ) : (
          t("products.form.buttons.create")
        )}
      </Button>
    </DialogFooter>
  );
}
