// src/components/stock/StockMovementForm.tsx
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createStockMovement } from '@/server/stock'

type MovementType = 'IN' | 'OUT'

interface Props {
  id: number
  type: MovementType
}

export function StockMovementForm({ id, type }: Props) {
  const navigate = useNavigate()

  const [quantity, setQuantity] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const isIn = type === 'IN'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const qty = Number(quantity)

    if (!qty || qty <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    setLoading(true)

    try {
      await createStockMovement({
        data: {
          product_id: id,
          quantity: isIn ? qty : -qty,
          movement_type: type,
          reference_type: 'adjustment',
          reference_id: referenceId ? Number(referenceId) : id,
          created_by: 1,
          notes,
        },
      })

      toast.success(
        isIn ? 'Stock added successfully' : 'Stock removed successfully',
      )

      navigate({
        to: '/products/$id',
        params: { id: String(id) },
      })
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create stock movement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-100">
      <CardHeader>
        <CardTitle>{isIn ? 'Add Stock' : 'Remove Stock'}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reference ID (optional)</Label>
            <Input
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="Example: purchase id"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : isIn ? 'Add Stock' : 'Remove Stock'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate({
                  to: '/products/$id',
                  params: { id: String(id) },
                })
              }
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
