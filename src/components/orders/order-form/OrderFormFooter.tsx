import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'

type Props = { orderId?: number; isSubmitting: boolean; onClose: () => void }

export default function OrderFormFooter({
  orderId,
  isSubmitting,
  onClose,
}: Props) {
  const { t } = useTranslation('orders')

  return (
    <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
      <Button type="button" variant="outline" onClick={onClose}>
        {t('form.buttons.cancel')}
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting
          ? t('form.buttons.saving')
          : orderId
            ? t('form.buttons.update')
            : t('form.buttons.create')}
      </Button>
    </DialogFooter>
  )
}
