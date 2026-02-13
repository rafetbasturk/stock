import { useState } from 'react'
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
import { toast } from 'sonner'
import { createStockMovement } from '@/server/stock'
import { useTranslation } from 'react-i18next'

interface StockAdjustmentDialogProps {
  product: {
    id: number
    name: string
    code: string
    stock_quantity: number
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StockAdjustmentDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const { t } = useTranslation('stock')
  const [quantity, setQuantity] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'IN' | 'OUT'>('IN')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return

    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error(t('invalid_quantity'))
      return
    }

    setLoading(true)
    try {
      await createStockMovement({
        data: {
          product_id: product.id,
          quantity: type === 'IN' ? qty : -qty,
          movement_type: type,
          reference_type: 'adjustment',
          reference_id: product.id,
          created_by: 1, // Will be handled by middleware/session later
          notes,
        },
      })

      toast.success(t('stock_adjusted_success'))
      setQuantity('')
      setNotes('')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || t('stock_adjustment_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('adjust_stock')}: {product?.name} ({product?.code})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex gap-4">
            <Button
              type="button"
              variant={type === 'IN' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setType('IN')}
            >
              {t('stock_in')}
            </Button>
            <Button
              type="button"
              variant={type === 'OUT' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => setType('OUT')}
            >
              {t('stock_out')}
            </Button>
          </div>

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
            <Button type="submit" disabled={loading}>
              {loading ? t('processing') : t('confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
