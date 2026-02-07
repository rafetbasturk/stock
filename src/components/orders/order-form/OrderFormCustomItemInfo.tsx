import { Plus, Trash2 } from 'lucide-react'
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

export default function OrderFormCustomItemInfo({
  form,
  errorHelpers,
  addCustomItem,
  removeCustomItem,
  onCustomItemChange,
}: Props) {
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
              <TableHead className="w-15">Sıra No</TableHead>
              <TableHead className="w-45 max-w-75">
                Ürün Adı
              </TableHead>
              <TableHead className="w-45">Açıklama</TableHead>
              <TableHead className="w-25">Birim</TableHead>
              <TableHead className="w-20">Adet</TableHead>
              <TableHead className="w-30 text-right">
                Birim Fiyat
              </TableHead>
              <TableHead className="w-30 text-right">Tutar</TableHead>
              <TableHead className="w-15 text-right">İşlem</TableHead>
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
                      placeholder="Ürün adı"
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
                      placeholder="Satır açıklaması"
                    />
                  </TableCell>
                  <TableCell>
                    <InputField
                      name={`customItems[${index}].unit`}
                      value={item.unit || 'adet'}
                      onChange={(e) =>
                        onCustomItemChange(index, 'unit', e.target.value)
                      }
                      placeholder="Birim"
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
                      type="number"
                      step="0.01"
                      value={(item.unit_price ?? 0) / 100}
                      onChange={(e) =>
                        onCustomItemChange(
                          index,
                          'unit_price',
                          Math.round(Number(e.target.value) * 100),
                        )
                      }
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
                  Toplam Tutar
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
                  placeholder="Ürün adı"
                  error={errorHelpers.get(`customItems[${index}].name`)}
                />
                <InputField
                  name={`customItems[${index}].notes-mobile`}
                  value={item.notes || ''}
                  onChange={(e) =>
                    onCustomItemChange(index, 'notes', e.target.value)
                  }
                  placeholder="Açıklama"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <InputField
                  name={`customItems[${index}].unit-mobile`}
                  value={item.unit || 'adet'}
                  onChange={(e) =>
                    onCustomItemChange(index, 'unit', e.target.value)
                  }
                  placeholder="Birim"
                />
                <InputField
                  name={`customItems[${index}].quantity-mobile`}
                  type="number"
                  min={1}
                  label="Adet"
                  value={item.quantity || 1}
                  onChange={(e) =>
                    onCustomItemChange(index, 'quantity', Number(e.target.value))
                  }
                  placeholder="Adet"
                />
                <InputField
                  name={`customItems[${index}].unit_price-mobile`}
                  type="number"
                  label="Birim Fiyat"
                  step="0.01"
                  value={(item.unit_price ?? 0) / 100}
                  onChange={(e) =>
                    onCustomItemChange(
                      index,
                      'unit_price',
                      Math.round(Number(e.target.value) * 100),
                    )
                  }
                  placeholder="Birim Fiyat"
                />
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm font-medium">Tutar</span>
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
            <span className="text-sm font-medium mr-2">Toplam Tutar:</span>
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
          Satır Ekle
        </Button>
      </div>
    </>
  )
}
