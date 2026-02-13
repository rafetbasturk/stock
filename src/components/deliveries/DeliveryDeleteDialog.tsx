import { useTranslation } from 'react-i18next'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'

interface DeleteDialogProps {
  open: boolean
  isDeleting: boolean
  deliveryLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function DeliveryDeleteDialog({
  open,
  isDeleting,
  deliveryLabel,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  const { t } = useTranslation('deleteDialogs')

  return (
    <ConfirmDeleteDialog
      open={open}
      isDeleting={isDeleting}
      title={t('delivery.title')}
      itemLabel={deliveryLabel}
      description={t('common.description')}
      cancelLabel={t('common.cancel')}
      confirmLabel={t('common.confirm')}
      confirmingLabel={t('common.confirming')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
