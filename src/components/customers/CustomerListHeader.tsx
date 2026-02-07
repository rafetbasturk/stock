import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/PageHeader'

interface CustomerListHeaderProps {
  onAdd: () => void
}

export function CustomerListHeader({ onAdd }: CustomerListHeaderProps) {
  return (
    <PageHeader
      title="Müşteri Listesi"
      actions={
        <Button
          aria-label="Add customer"
          className="w-12 rounded-md"
          onClick={onAdd}
        >
          <Plus className="size-5" />
        </Button>
      }
    />
  )
}
