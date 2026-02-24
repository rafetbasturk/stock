import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrderCalculations } from './hooks/useOrderCalculations'
import EmptyOrderProducts from './EmptyOrderProducts'
import type { FormErrors, OrderFormState, SelectProduct } from '../OrderForm'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import EntityCombobox from '@/components/form/EntityCombobox'
import InputField from '@/components/form/InputField'
import { convertToCurrencyFormat } from '@/lib/currency'
import { formatNumberForDisplay, parseLocaleNumber } from '@/lib/inputUtils'

const getItemKey = (item: OrderFormState['items'][number], index: number) => {
  return `item-${item.id || index}`
}

const calculateItemTotal = (item: OrderFormState['items'][number]) => {
  const quantity = Number(item.quantity)
  const unitPrice = Number(item.unit_price)
  return quantity * unitPrice
}

const toCentsFromInput = (value: string) =>
  Math.round(parseLocaleNumber(value) * 100)

type Props = {
  form: OrderFormState
  errorHelpers: FormErrors
  products?: Array<SelectProduct>
  isLoading: boolean
  onItemChange: (
    idx: number,
    field: keyof OrderFormState['items'][number],
    value: any,
  ) => void
  removeItem: (index: number) => void
  addItem: () => void
}

export default function OrderFormProductInfo({
  form,
  errorHelpers,
  products,
  isLoading,
  onItemChange,
  removeItem,
  addItem,
}: Props) {
  const { t } = useTranslation('orders')
  const { formattedTotal } = useOrderCalculations(
    form.items,
    form.currency ?? 'TRY',
  )
  const itemsError = errorHelpers.get('items')

  return (
    <>
      <div className="hidden md:block w-full overflow-x-auto">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-20">{t('form.table.row_no')}</TableHead>
              <TableHead className="max-w-100">{t('form.table.product')}</TableHead>
              <TableHead className="w-25">{t('form.table.quantity')}</TableHead>
              <TableHead className="w-30 text-right">
                {t('form.table.unit_price')}
              </TableHead>
              <TableHead className="w-30 text-right">{t('form.table.amount')}</TableHead>
              <TableHead className="w-20 text-right">{t('form.table.action')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {form.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  <EmptyOrderProducts />
                </TableCell>
              </TableRow>
            ) : (
              form.items.map((item, index) => (
                <TableRow key={getItemKey(item, index)} className="h-20">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="relative">
                    <EntityCombobox
                      placeholder={t('form.placeholders.product')}
                      entities={products || []}
                      value={item.product_id}
                      onChange={(id) => onItemChange(index, 'product_id', id)}
                      isLoading={isLoading}
                      error={errorHelpers.get(`items[${index}].product_id`)}
                    />
                  </TableCell>
                  <TableCell>
                    <InputField
                      name={`items[${index}].quantity`}
                      value={item.quantity || 1}
                      type="number"
                      min={1}
                      onChange={(e) =>
                        onItemChange(index, 'quantity', Number(e.target.value))
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <InputField
                      name={`items[${index}].unit_price`}
                      type="text"
                      inputMode="decimal"
                      value={
                        item.unit_price_raw ??
                        formatNumberForDisplay(item.unit_price / 100)
                      }
                      onChange={(e) => {
                        onItemChange(index, 'unit_price_raw', e.target.value)
                        onItemChange(
                          index,
                          'unit_price',
                          toCentsFromInput(e.target.value),
                        )
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {convertToCurrencyFormat({
                      cents: calculateItemTotal(item),
                      currency: form.currency ?? 'TRY',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="flex items-center justify-center ml-auto w-8 h-8 sm:w-9 sm:h-9"
                    >
                      <Trash2 className="size-3 sm:size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          {form.items.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  {t('form.table.total_amount')}
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formattedTotal}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <div className="space-y-4">
        <div className="block md:hidden space-y-4">
          {form.items.length === 0 ? (
            <EmptyOrderProducts />
          ) : (
            form.items.map((item, index) => (
              <div
                key={getItemKey(item, index)}
                className="border rounded-2xl p-4 shadow-sm space-y-3 bg-background relative"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-muted-foreground">
                    #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="w-8 h-8"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div>
                  <EntityCombobox
                    placeholder={t('form.placeholders.product')}
                    entities={products || []}
                    value={item.product_id}
                    onChange={(id) => onItemChange(index, 'product_id', id)}
                    isLoading={isLoading}
                    error={errorHelpers.get(`items[${index}].product_id`)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    name={`items[${index}].quantity-mobile`}
                    label={t('form.table.quantity')}
                    type="number"
                    value={item.quantity || 1}
                    min={1}
                    onChange={(e) =>
                      onItemChange(index, 'quantity', Number(e.target.value))
                    }
                  />

                  <InputField
                    name={`items[${index}].unit_price-mobile`}
                    label={t('form.table.unit_price')}
                    type="text"
                    inputMode="decimal"
                    value={
                      item.unit_price_raw ??
                      formatNumberForDisplay(item.unit_price / 100)
                    }
                    onChange={(e) => {
                      onItemChange(index, 'unit_price_raw', e.target.value)
                      onItemChange(
                        index,
                        'unit_price',
                        toCentsFromInput(e.target.value),
                      )
                    }}
                  />
                </div>

                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-sm font-medium">{t('form.table.amount')}</span>
                  <span className="text-lg font-semibold">
                    {convertToCurrencyFormat({
                      cents: calculateItemTotal(item),
                      currency: form.currency ?? 'TRY',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}

          {form.items.length > 0 && (
            <div className="border-t pt-4 text-right">
              <span className="text-sm font-medium mr-2">
                {t('form.table.total_amount')}:
              </span>
              <span className="text-lg font-bold">{formattedTotal}</span>
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              addItem()
              errorHelpers.clear('items')
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('form.buttons.add_row')}
          </Button>
          {itemsError && (
            <FieldError className="text-xs absolute -bottom-4">
              {t(`${itemsError.i18n.ns}:${itemsError.i18n.key}`, itemsError.params)}
            </FieldError>
          )}
        </div>
      </div>
    </>
  )
}
