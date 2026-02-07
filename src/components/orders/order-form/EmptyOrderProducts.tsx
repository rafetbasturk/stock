import { ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function EmptyOrderProducts() {
  const { t } = useTranslation('orders')

  return (
    <div className="border border-dashed rounded-md p-8 text-center text-muted-foreground">
      <ShoppingCart className="h-10 w-10 mx-auto mb-2" />
      <p className="font-medium">{t('form.empty.title')}</p>
      <p className="text-sm">{t('form.empty.description')}</p>
    </div>
  )
}
