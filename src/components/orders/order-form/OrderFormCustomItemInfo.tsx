import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrderCalculations } from './hooks/useOrderCalculations'
import EmptyOrderProducts from './EmptyOrderProducts'
import type { FormErrors, OrderFormState } from '../OrderForm'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import InputField from '@/components/form/InputField'
import { convertToCurrencyFormat } from '@/lib/currency'
import { formatNumberForDisplay, parseLocaleNumber } from '@/lib/inputUtils'

const getItemKey = (
  item: OrderFormState['customItems'][number],
  index: number,
) => {
  return `item-${item.id || item.tempId || index}`
}

type Props = {
  form: OrderFormState
  errorHelpers: FormErrors
  addCustomItem: () => void
  removeCustomItem: (idx: number) => void
  onCustomItemChange: (
    idx: number,
    field: keyof OrderFormState['customItems'][0],
    value: any,
  ) => void
}

const toCentsFromInput = (value: string) =>
  Math.round(parseLocaleNumber(value) * 100)

export default function OrderFormCustomItemInfo({
  form,
  errorHelpers,
  addCustomItem,
  removeCustomItem,
  onCustomItemChange,
}: Props) {
  const { t } = useTranslation('orders')
  const { formattedTotal } = useOrderCalculations(
    form.customItems,
    form.currency ?? 'TRY',
  )

  return (
    <>
      <div className="hidden md:block w-full overflow-x-auto">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-15">{t('form.table.row_no')}</TableHead>
              <TableHead className="w-45 max-w-75">
                {t('form.table.product')}
              </TableHead>
              <TableHead className="w-45">{t('form.table.description')}</TableHead>
              <TableHead className="w-25">{t('form.table.unit')}</TableHead>
              <TableHead className="w-20">{t('form.table.quantity')}</TableHead>
              <TableHead className="w-30 text-right">
                {t('form.table.unit_price')}
              </TableHead>
              <TableHead className="w-30 text-right">{t('form.table.amount')}</TableHead>
              <TableHead className="w-15 text-right">{t('form.table.action')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {form.customItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  <EmptyOrderProducts />
                </TableCell>
              </TableRow>
            ) : (
              form.customItems.map((item, index) => (
                <TableRow key={getItemKey(item, index)} className="h-20">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <InputField
                      name={`customItems[${index}].name`}
                      value={item.name || ''}
                      onChange={(e) =>
                        onCustomItemChange(index, 'name', e.target.value)
                      }
                      placeholder={t('form.placeholders.custom_item_name')}
                      error={errorHelpers.get(`customItems[${index}].name`)}
                    />
                  </TableCell>
                  <TableCell>
                    <InputField
                      name={`customItems[${index}].notes`}
                      value={item.notes || ''}
                      onChange={(e) =>
                        onCustomItemChange(index, 'notes', e.target.value)
                      }
                      placeholder={t('form.placeholders.custom_item_notes')}
                    />
                  </TableCell>
                  <TableCell>
                    <InputField
                      name={`customItems[${index}].unit`}
                      value={item.unit || 'adet'}
                      onChange={(e) =>
                        onCustomItemChange(index, 'unit', e.target.value)
                      }
                      placeholder={t('form.placeholders.custom_item_unit')}
                    />
                  </TableCell>
                  <TableCell>
                    <InputField
                      name={`customItems[${index}].quantity`}
                      type="number"
                      min={1}
                      value={item.quantity || 1}
                      onChange={(e) =>
                        onCustomItemChange(
                          index,
                          'quantity',
                          Number(e.target.value),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <InputField
                      name={`customItems[${index}].unit_price`}
                      type="text"
                      inputMode="decimal"
                      value={formatNumberForDisplay(
                        item.unit_price_raw ?? (item.unit_price ?? 0) / 100,
                      )}
                      onChange={(e) => {
                        onCustomItemChange(
                          index,
                          'unit_price_raw',
                          e.target.value,
                        )
                        onCustomItemChange(
                          index,
                          'unit_price',
                          toCentsFromInput(e.target.value),
                        )
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {convertToCurrencyFormat({
                      cents:
                        Number(item.quantity ?? 0) *
                        Number(item.unit_price ?? 0),
                      currency: form.currency ?? 'TRY',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCustomItem(index)}
                      className="flex items-center justify-center ml-auto w-8 h-8 sm:w-9 sm:h-9"
                    >
                      <Trash2 className="size-3 sm:size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          {form.customItems.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="text-right font-medium">
                  {t('form.table.total_amount')}
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formattedTotal}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <div className="block md:hidden space-y-4 mt-4">
        {form.customItems.length === 0 ? (
          <EmptyOrderProducts />
        ) : (
          form.customItems.map((item, index) => (
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
                  onClick={() => removeCustomItem(index)}
                  className="w-8 h-8"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <InputField
                  name={`customItems[${index}].name-mobile`}
                  value={item.name || ''}
                  onChange={(e) =>
                    onCustomItemChange(index, 'name', e.target.value)
                  }
                  placeholder={t('form.placeholders.custom_item_name')}
                  error={errorHelpers.get(`customItems[${index}].name`)}
                />
                <InputField
                  name={`customItems[${index}].notes-mobile`}
                  value={item.notes || ''}
                  onChange={(e) =>
                    onCustomItemChange(index, 'notes', e.target.value)
                  }
                  placeholder={t('form.table.description')}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <InputField
                  name={`customItems[${index}].unit-mobile`}
                  value={item.unit || 'adet'}
                  onChange={(e) =>
                    onCustomItemChange(index, 'unit', e.target.value)
                  }
                  placeholder={t('form.placeholders.custom_item_unit')}
                />
                <InputField
                  name={`customItems[${index}].quantity-mobile`}
                  type="number"
                  min={1}
                  label={t('form.table.quantity')}
                  value={item.quantity || 1}
                  onChange={(e) =>
                    onCustomItemChange(index, 'quantity', Number(e.target.value))
                  }
                  placeholder={t('form.placeholders.quantity')}
                />
                <InputField
                  name={`customItems[${index}].unit_price-mobile`}
                  type="text"
                  inputMode="decimal"
                  label={t('form.table.unit_price')}
                  value={formatNumberForDisplay(
                    item.unit_price_raw ?? (item.unit_price ?? 0) / 100,
                  )}
                  onChange={(e) => {
                    onCustomItemChange(index, 'unit_price_raw', e.target.value)
                    onCustomItemChange(
                      index,
                      'unit_price',
                      toCentsFromInput(e.target.value),
                    )
                  }}
                  placeholder={t('form.placeholders.unit_price')}
                />
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm font-medium">{t('form.table.amount')}</span>
                <span className="text-lg font-semibold">
                  {convertToCurrencyFormat({
                    cents:
                      Number(item.quantity ?? 0) * Number(item.unit_price ?? 0),
                    currency: form.currency ?? 'TRY',
                  })}
                </span>
              </div>
            </div>
          ))
        )}

        {form.customItems.length > 0 && (
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
          onClick={addCustomItem}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('form.buttons.add_row')}
        </Button>
      </div>
    </>
  )
}
