import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/PageHeader'

interface ProductListHeaderProps {
  onAdd: () => void
}

export function ProductListHeader({ onAdd }: ProductListHeaderProps) {
  const { t } = useTranslation('entities')

  return (
    <PageHeader
      title={t('products.list_title')}
      actions={
        <Button
          aria-label={t('actions.add_product_aria')}
          className="w-12 rounded-md"
          onClick={onAdd}
        >
          <Plus className="size-5" />
        </Button>
      }
    />
  )
}
