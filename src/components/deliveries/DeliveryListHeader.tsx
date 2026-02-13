import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/PageHeader'

interface DeliveryListHeaderProps {
  onAdd: () => void
}

export function DeliveryListHeader({ onAdd }: DeliveryListHeaderProps) {
  const { t } = useTranslation('entities')

  return (
    <PageHeader
      title={t('deliveries.list_title')}
      actions={
        <Button
          aria-label={t('actions.add_order_aria')}
          className="w-12 rounded-md"
          onClick={onAdd}
        >
          <Plus className="size-5" />
        </Button>
      }
    />
  )
}
