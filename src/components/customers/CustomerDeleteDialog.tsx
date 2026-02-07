import { useTranslation } from 'react-i18next'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'

interface CustomerDeleteDialogProps {
  open: boolean
  isDeleting: boolean
  customerLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function CustomerDeleteDialog({
  open,
  isDeleting,
  customerLabel,
  onClose,
  onConfirm,
}: CustomerDeleteDialogProps) {
  const { t } = useTranslation('deleteDialogs')

  return (
    <ConfirmDeleteDialog
      open={open}
      isDeleting={isDeleting}
      title={t('customer.title')}
      itemLabel={customerLabel}
      description={t('common.description')}
      cancelLabel={t('common.cancel')}
      confirmLabel={t('common.confirm')}
      confirmingLabel={t('common.confirming')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
