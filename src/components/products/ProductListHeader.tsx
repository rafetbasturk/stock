import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/PageHeader'

interface ProductListHeaderProps {
  onAdd: () => void
}

export function ProductListHeader({ onAdd }: ProductListHeaderProps) {
  return (
    <PageHeader
      title="Ürün Listesi"
      actions={
        <Button aria-label="Add product" className="w-12 rounded-md" onClick={onAdd}>
          <Plus className="size-5" />
        </Button>
      }
    />
  )
}
