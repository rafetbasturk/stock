import { useTranslation } from 'react-i18next'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'

interface ProductDeleteDialogProps {
  open: boolean
  isDeleting: boolean
  productLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function ProductDeleteDialog({
  open,
  isDeleting,
  productLabel,
  onClose,
  onConfirm,
}: ProductDeleteDialogProps) {
  const { t } = useTranslation('deleteDialogs')

  return (
    <ConfirmDeleteDialog
      open={open}
      isDeleting={isDeleting}
      title={t('product.title')}
      itemLabel={productLabel}
      description={t('common.description')}
      cancelLabel={t('common.cancel')}
      confirmLabel={t('common.confirm')}
      confirmingLabel={t('common.confirming')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
