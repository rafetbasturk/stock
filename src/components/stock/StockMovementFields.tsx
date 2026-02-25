import { useTranslation } from 'react-i18next'
import EntityCombobox from '@/components/form/EntityCombobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type MovementType = 'IN' | 'OUT' | 'TRANSFER'

type TransferTarget = {
  id: number
  code?: string
  name: string
}

interface StockMovementFieldsProps {
  quantity: string
  notes: string
  onQuantityChange: (value: string) => void
  onNotesChange: (value: string) => void
  movementType?: MovementType
  onMovementTypeChange?: (value: MovementType) => void
  allowTypeToggle?: boolean
  allowTransfer?: boolean
  transferTargets?: Array<TransferTarget>
  toProductId?: number | null
  onToProductIdChange?: (value: number) => void
  transferLoading?: boolean
  showReferenceId?: boolean
  referenceId?: string
  onReferenceIdChange?: (value: string) => void
  typeToggleContainerClassName?: string
  typeToggleButtonClassName?: string
}

export function StockMovementFields({
  quantity,
  notes,
  onQuantityChange,
  onNotesChange,
  movementType = 'IN',
  onMovementTypeChange,
  allowTypeToggle = false,
  allowTransfer = false,
  transferTargets = [],
  toProductId = null,
  onToProductIdChange,
  transferLoading = false,
  showReferenceId = false,
  referenceId = '',
  onReferenceIdChange,
  typeToggleContainerClassName,
  typeToggleButtonClassName,
}: StockMovementFieldsProps) {
  const { t } = useTranslation('stock')
  const isTransfer = movementType === 'TRANSFER'

  return (
    <>
      {allowTypeToggle && onMovementTypeChange && (
        <div className={['flex gap-2', typeToggleContainerClassName].filter(Boolean).join(' ')}>
          <Button
            type="button"
            variant={movementType === 'IN' ? 'default' : 'outline'}
            className={typeToggleButtonClassName}
            onClick={() => onMovementTypeChange('IN')}
          >
            {t('stock_in')}
          </Button>
          <Button
            type="button"
            variant={movementType === 'OUT' ? 'destructive' : 'outline'}
            className={typeToggleButtonClassName}
            onClick={() => onMovementTypeChange('OUT')}
          >
            {t('stock_out')}
          </Button>
          {allowTransfer && (
            <Button
              type="button"
              variant={movementType === 'TRANSFER' ? 'secondary' : 'outline'}
              className={typeToggleButtonClassName}
              onClick={() => onMovementTypeChange('TRANSFER')}
            >
              {t('stock_transfer')}
            </Button>
          )}
        </div>
      )}

      {allowTransfer && isTransfer && onToProductIdChange && (
        <div className="space-y-2">
          <EntityCombobox
            id="stock_transfer_target"
            label={t('target_product')}
            placeholder={t('select_target_product')}
            entities={transferTargets}
            value={toProductId}
            onChange={onToProductIdChange}
            isLoading={transferLoading}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>{t('quantity')}</Label>
        <Input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          placeholder={t('quantity_placeholder')}
          required
        />
      </div>

      {showReferenceId && !isTransfer && onReferenceIdChange && (
        <div className="space-y-2">
          <Label>{t('reference_id_optional')}</Label>
          <Input
            value={referenceId}
            onChange={(e) => onReferenceIdChange(e.target.value)}
            placeholder={t('reference_id_placeholder')}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>{t('notes')}</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t('notes_placeholder')}
        />
      </div>
    </>
  )
}
