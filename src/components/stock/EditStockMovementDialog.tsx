import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from 'react-i18next'
import { useUpdateStockMovement } from '@/lib/mutations/stock'

interface EditStockMovementDialogProps {
  movement: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditStockMovementDialog({
  movement,
  open,
  onOpenChange,
}: EditStockMovementDialogProps) {
  const { t } = useTranslation('stock')
  const [quantity, setQuantity] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const updateMutation = useUpdateStockMovement()

  useEffect(() => {
    if (movement) {
      setQuantity(Math.abs(movement.quantity).toString())
      setNotes(movement.notes || '')
    }
  }, [movement])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!movement) return

    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0) {
      return
    }

    const finalQuantity = movement.quantity >= 0 ? qty : -qty

    updateMutation.mutate(
      {
        id: movement.id,
        quantity: finalQuantity,
        notes,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit_movement')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">{t('quantity')}</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notes_placeholder')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('processing') : t('confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
