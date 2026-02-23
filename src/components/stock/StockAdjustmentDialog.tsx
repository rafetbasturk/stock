import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StockMovementFields } from '@/components/stock/StockMovementFields'
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

  async function handleSubmit(e: React.SubmitEvent) {
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
          <StockMovementFields
            quantity={quantity}
            notes={notes}
            onQuantityChange={setQuantity}
            onNotesChange={setNotes}
            movementType={type}
            onMovementTypeChange={(value) => {
              if (value !== 'TRANSFER') {
                setType(value)
              }
            }}
            allowTypeToggle
            typeToggleButtonClassName="flex-1"
          />

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
