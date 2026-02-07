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
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        {orderId ? 'Siparişi Düzenle' : 'Yeni Sipariş Ekle'}
        {isSubmitting && <LoadingSpinner variant="inline" text="" />}
      </DialogTitle>
      <DialogDescription>
        Sipariş bilgilerini doldurun ve kaydedin.
      </DialogDescription>
    </DialogHeader>
  )
}
