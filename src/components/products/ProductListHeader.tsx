import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/PageHeader'

interface ProductListHeaderProps {
  onAdd: () => void
}

export function ProductListHeader({ onAdd }: ProductListHeaderProps) {
  const { t } = useTranslation(['entities', 'stock'])

  return (
    <PageHeader
      title={t('entities:products.list_title')}
      actions={
        <div className="flex gap-2">
          <Button
            aria-label={t('entities:actions.add_product_aria')}
            className="w-12 rounded-md"
            onClick={onAdd}
          >
            <Plus className="size-5" />
          </Button>
        </div>
      }
    />
  )
}
