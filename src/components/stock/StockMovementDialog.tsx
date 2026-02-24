import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { StockMovementFields } from '@/components/stock/StockMovementFields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMobileReadonly } from '@/hooks/useMobileReadonly'
import { useUpdateStockMovement } from '@/lib/mutations/stock'
import { productQueryKeys, selectProductsQuery } from '@/lib/queries/products'
import { stockQueryKeys } from '@/lib/queries/stock'
import { createStockMovement, createStockTransfer } from '@/server/stock'
import type { MovementRow } from '@/types'

type MovementType = 'IN' | 'OUT' | 'TRANSFER'

type ProductLike = {
  id: number
  name: string
  code: string
}

type BaseProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type CreateProps = BaseProps & {
  mode: 'create'
  productId: number
}

type EditProps = BaseProps & {
  mode: 'edit'
  movement: MovementRow | null
}

type AdjustProps = BaseProps & {
  mode: 'adjust'
  product: ProductLike | null
}

type StockMovementDialogProps = CreateProps | EditProps | AdjustProps

export function StockMovementDialog(props: StockMovementDialogProps) {
  const isMobileReadonly = useMobileReadonly()
  const { t } = useTranslation('stock')
  const queryClient = useQueryClient()
  const updateMutation = useUpdateStockMovement()

  const [movementType, setMovementType] = useState<MovementType>('IN')
  const [quantity, setQuantity] = useState('')
  const [toProductId, setToProductId] = useState<number | null>(null)
  const [referenceId, setReferenceId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const isCreate = props.mode === 'create'
  const isEdit = props.mode === 'edit'
  const isAdjust = props.mode === 'adjust'

  const sourceProductId =
    props.mode === 'create'
      ? props.productId
      : props.mode === 'edit'
        ? props.movement?.product_id ?? null
        : props.product?.id ?? null

  useEffect(() => {
    if (!props.open) return

    if (isEdit) {
      const movement = props.movement
      if (!movement) return
      setMovementType(movement.quantity >= 0 ? 'IN' : 'OUT')
      setQuantity(Math.abs(movement.quantity).toString())
      setNotes(movement.notes || '')
      setReferenceId('')
      setToProductId(null)
      return
    }

    setMovementType('IN')
    setQuantity('')
    setNotes('')
    setReferenceId('')
    setToProductId(null)
  }, [props.open, isEdit, isEdit ? props.movement : null])

  const productsQuery = useQuery({
    ...selectProductsQuery,
    enabled: props.open && isCreate && movementType === 'TRANSFER',
  })

  const transferTargets = useMemo(() => {
    if (!sourceProductId) return []
    return (
      productsQuery.data?.filter((product) => product.id !== sourceProductId) ??
      []
    )
  }, [productsQuery.data, sourceProductId])

  const title = useMemo(() => {
    if (isEdit) return t('edit_movement')
    if (isAdjust) {
      const product = props.product
      if (!product) return t('adjust_stock')
      return `${t('adjust_stock')}: ${product.name} (${product.code})`
    }
    return t('add_activity')
  }, [
    isAdjust,
    isEdit,
    t,
    isAdjust ? props.product?.name : undefined,
    isAdjust ? props.product?.code : undefined,
  ])

  const pending = loading || updateMutation.isPending

  const submitLabel = useMemo(() => {
    if (pending) return t('processing')

    if (isEdit || isAdjust) return t('confirm')

    if (movementType === 'TRANSFER') return t('stock_transfer')
    if (movementType === 'IN') return t('stock_in')
    return t('stock_out')
  }, [isAdjust, isEdit, movementType, pending, t])

  async function invalidateAfterSuccess(extraProductId?: number | null) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all }),
      sourceProductId
        ? queryClient.invalidateQueries({
            queryKey: productQueryKeys.detail(sourceProductId),
          })
        : Promise.resolve(),
      extraProductId
        ? queryClient.invalidateQueries({
            queryKey: productQueryKeys.detail(extraProductId),
          })
        : Promise.resolve(),
    ])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isMobileReadonly) return

    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      toast.error(t('invalid_quantity'))
      return
    }

    if (isEdit) {
      const movement = props.movement
      if (!movement) return

      const finalQuantity = movement.quantity >= 0 ? qty : -qty

      updateMutation.mutate(
        {
          id: movement.id,
          quantity: finalQuantity,
          notes,
        },
        {
          onSuccess: () => {
            props.onSuccess?.()
            props.onOpenChange(false)
          },
        },
      )
      return
    }

    if (!sourceProductId) return

    setLoading(true)
    try {
      if (movementType === 'TRANSFER') {
        if (!toProductId || toProductId <= 0) {
          toast.error(t('select_target_product'))
          return
        }

        await createStockTransfer({
          data: {
            from_product_id: sourceProductId,
            to_product_id: toProductId,
            quantity: qty,
            notes,
          },
        })

        toast.success(t('stock_transfer_success'))

        await invalidateAfterSuccess(toProductId)
      } else {
        const isIn = movementType === 'IN'
        const isAdjustment = isAdjust

        await createStockMovement({
          data: {
            product_id: sourceProductId,
            quantity: isIn ? qty : -qty,
            movement_type: movementType,
            reference_type: isAdjustment
              ? 'adjustment'
              : referenceId
                ? 'adjustment'
                : null,
            reference_id: isAdjustment
              ? sourceProductId
              : referenceId
                ? Number(referenceId)
                : null,
            notes,
          },
        })

        toast.success(
          isAdjustment
            ? t('stock_adjusted_success')
            : isIn
              ? t('stock_in_success')
              : t('stock_out_success'),
        )

        await invalidateAfterSuccess()
      }

      props.onSuccess?.()
      props.onOpenChange(false)
    } catch (error: any) {
      if (isAdjust) {
        toast.error(error?.message || t('stock_adjustment_failed'))
      } else {
        toast.error(error?.message || t('create_movement_failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <StockMovementFields
            quantity={quantity}
            notes={notes}
            onQuantityChange={setQuantity}
            onNotesChange={setNotes}
            movementType={movementType}
            onMovementTypeChange={
              isEdit
                ? undefined
                : (value) => {
                    if (isAdjust && value === 'TRANSFER') return
                    setMovementType(value)
                  }
            }
            allowTypeToggle={!isEdit}
            allowTransfer={isCreate}
            transferTargets={transferTargets}
            toProductId={toProductId}
            onToProductIdChange={setToProductId}
            transferLoading={productsQuery.isLoading}
            showReferenceId={isCreate}
            referenceId={referenceId}
            onReferenceIdChange={setReferenceId}
            typeToggleButtonClassName={isAdjust ? 'flex-1' : undefined}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={pending || isMobileReadonly}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
