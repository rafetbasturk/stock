import { useTranslation } from 'react-i18next'
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  orderId?: number
}

export default function OrderFormHeader({ orderId }: Props) {
  const { t } = useTranslation('orders')

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        {orderId ? t('form.header.edit') : t('form.header.create')}
      </DialogTitle>
      <DialogDescription>{t('form.header.description')}</DialogDescription>
    </DialogHeader>
  )
}
