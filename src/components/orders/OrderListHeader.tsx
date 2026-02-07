import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/PageHeader'

interface OrderListHeaderProps {
  onAdd: () => void
}

export function OrderListHeader({ onAdd }: OrderListHeaderProps) {
  return (
    <PageHeader
      title="Sipariş Listesi"
      actions={
        <Button aria-label="Add order" className="w-12 rounded-md" onClick={onAdd}>
          <Plus className="size-5" />
        </Button>
      }
    />
  )
}
