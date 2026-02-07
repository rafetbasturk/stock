import { useTranslation } from 'react-i18next'
import OrderFormCustomItemInfo from './OrderFormCustomItemInfo'
import OrderFormProductInfo from './OrderFormProductInfo'
import type { NewOrderItem } from '@/types'
import type { FormErrors, OrderFormState, SelectProduct } from '../OrderForm'
import { FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type Props = {
  form: OrderFormState
  errorHelpers: FormErrors
  products?: Array<SelectProduct>
  isLoading: boolean
  toggleCustomMode: (checked: boolean) => void
  onItemChange: (idx: number, field: keyof NewOrderItem, value: any) => void
  removeItem: (index: number) => void
  addItem: () => void
  onCustomItemChange: (
    idx: number,
    field: keyof OrderFormState['customItems'][0],
    value: any,
  ) => void
  removeCustomItem: (idx: number) => void
  addCustomItem: () => void
}

export default function OrderFormItems({
  form,
  errorHelpers,
  products,
  isLoading,
  toggleCustomMode,
  onItemChange,
  removeItem,
  addItem,
  onCustomItemChange,
  removeCustomItem,
  addCustomItem,
}: Props) {
  const { t } = useTranslation('orders')

  return (
    <FieldSet>
      <div className="flex justify-between items-center">
        <FieldLegend className="m-0">{t('form.sections.items')}</FieldLegend>
        <div className="flex items-center space-x-2">
          <Label htmlFor="custom-order">{t('form.custom_order')}</Label>
          <Switch
            id="custom-order"
            checked={form.is_custom_order ?? false}
            onCheckedChange={toggleCustomMode}
          />
        </div>
      </div>

      <FieldSeparator />

      {form.is_custom_order ? (
        <OrderFormCustomItemInfo
          form={form}
          errorHelpers={errorHelpers}
          onCustomItemChange={onCustomItemChange}
          removeCustomItem={removeCustomItem}
          addCustomItem={addCustomItem}
        />
      ) : (
        <OrderFormProductInfo
          form={form}
          errorHelpers={errorHelpers}
          products={products}
          isLoading={isLoading}
          onItemChange={onItemChange}
          removeItem={removeItem}
          addItem={addItem}
        />
      )}
    </FieldSet>
  )
}
