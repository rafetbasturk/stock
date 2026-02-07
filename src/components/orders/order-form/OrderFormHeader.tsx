import { useTranslation } from 'react-i18next'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  orderId?: number
  isSubmitting: boolean
}

export default function OrderFormHeader({ orderId, isSubmitting }: Props) {
  const { t } = useTranslation('orders')

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        {orderId ? t('form.header.edit') : t('form.header.create')}
        {isSubmitting && <LoadingSpinner variant="inline" text="" />}
      </DialogTitle>
      <DialogDescription>{t('form.header.description')}</DialogDescription>
    </DialogHeader>
  )
}
