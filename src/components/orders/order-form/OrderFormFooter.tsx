import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'

type Props = { orderId?: number; isSubmitting: boolean; onClose: () => void }

export default function OrderFormFooter({
  orderId,
  isSubmitting,
  onClose,
}: Props) {
  return (
    <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
      <Button type="button" variant="outline" onClick={onClose}>
        İptal
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? 'Kaydediliyor...' : orderId ? 'Güncelle' : 'Ekle'}
      </Button>
    </DialogFooter>
  )
}
