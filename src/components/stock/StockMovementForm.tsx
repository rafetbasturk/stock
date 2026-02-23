// src/components/stock/StockMovementForm.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StockMovementFields } from '@/components/stock/StockMovementFields'
import { toast } from 'sonner'
import { selectProductsQuery } from '@/lib/queries/products'
import { productQueryKeys } from '@/lib/queries/products'
import { createStockMovement, createStockTransfer } from '@/server/stock'

type MovementType = 'IN' | 'OUT' | 'TRANSFER'

interface Props {
  id: number
  type?: MovementType
  navigateOnSuccess?: boolean
  showCancel?: boolean
  onSuccess?: () => void
}

export function StockMovementForm({
  id,
  type,
  navigateOnSuccess = true,
  showCancel = true,
  onSuccess,
}: Props) {
  const { t } = useTranslation('stock')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [movementType, setMovementType] = useState<MovementType>(type ?? 'IN')
  const [quantity, setQuantity] = useState('')
  const [toProductId, setToProductId] = useState<number | null>(null)
  const [referenceId, setReferenceId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const isIn = movementType === 'IN'
  const isTransfer = movementType === 'TRANSFER'

  const productsQuery = useQuery({
    ...selectProductsQuery,
    enabled: isTransfer,
  })

  const transferTargets =
    productsQuery.data?.filter((product) => product.id !== id) ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const qty = Number(quantity)

    if (!qty || qty <= 0) {
      toast.error(t('invalid_quantity'))
      return
    }

    setLoading(true)

    try {
      if (isTransfer) {
        const target = toProductId
        if (!target || target <= 0) {
          toast.error(t('select_target_product'))
          return
        }

        await createStockTransfer({
          data: {
            from_product_id: id,
            to_product_id: target,
            quantity: qty,
            notes,
          },
        })
      } else {
        await createStockMovement({
          data: {
            product_id: id,
            quantity: isIn ? qty : -qty,
            movement_type: movementType,
            reference_type: referenceId ? 'adjustment' : null,
            reference_id: referenceId ? Number(referenceId) : null,
            notes,
          },
        })
      }

      toast.success(
        isTransfer
          ? t('stock_transfer_success')
          : isIn
            ? t('stock_in_success')
            : t('stock_out_success'),
      )

      setQuantity('')
      setReferenceId('')
      setNotes('')
      setToProductId(null)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-movements', id] }),
        queryClient.invalidateQueries({ queryKey: ['stock'] }),
        queryClient.invalidateQueries({
          queryKey: productQueryKeys.detail(id),
        }),
      ])

      onSuccess?.()

      if (navigateOnSuccess) {
        navigate({
          to: '/products/$id',
          params: { id: String(id) },
        })
      }
    } catch (err: any) {
      toast.error(err?.message ?? t('create_movement_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isTransfer ? t('stock_transfer') : isIn ? t('stock_in') : t('stock_out')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <StockMovementFields
            quantity={quantity}
            notes={notes}
            onQuantityChange={setQuantity}
            onNotesChange={setNotes}
            movementType={movementType}
            onMovementTypeChange={setMovementType}
            allowTypeToggle={!type}
            allowTransfer
            transferTargets={transferTargets}
            toProductId={toProductId}
            onToProductIdChange={setToProductId}
            transferLoading={productsQuery.isLoading}
            showReferenceId
            referenceId={referenceId}
            onReferenceIdChange={setReferenceId}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading
                ? t('processing')
                : isTransfer
                  ? t('stock_transfer')
                  : isIn
                    ? t('stock_in')
                    : t('stock_out')}
            </Button>

            {showCancel && (
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
                {t('cancel')}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
