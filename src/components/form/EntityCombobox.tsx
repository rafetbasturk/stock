import Combobox, { type ComboItem } from './Combobox'
import type { I18nErrorMessage } from '@/lib/error/core/errorTransport'

type Entity = {
  id: number
  code?: string
  name: string
  [key: string]: any
}

type Props<T extends Entity> = {
  id?: string
  label?: string
  placeholder?: string
  entities: Array<T>
  value: number | null
  onChange: (id: number) => void
  isLoading?: boolean
  error?: I18nErrorMessage
  required?: boolean
}

export default function EntityCombobox<T extends Entity>({
  id = 'entity_id',
  label,
  placeholder = 'Bir kayıt seçin',
  entities,
  value,
  onChange,
  isLoading = false,
  error,
  required = false,
}: Props<T>) {
  const items: ComboItem[] = entities.map((entity) => ({
    value: entity.id,
    label: entity.code ? `${entity.code} - ${entity.name}` : entity.name,
    searchText: `${entity.code ?? ''} ${entity.name}`,
    data: entity,
  }))

  return (
    <Combobox
      id={id}
      label={label}
      placeholder={placeholder}
      items={items}
      value={value}
      onChange={(selectedValue) => onChange(Number(selectedValue))}
      isLoading={isLoading}
      error={error}
      required={required}
      renderItem={(item) => {
        const entity = item.data as T | undefined
        const hasPrice =
          entity &&
          typeof entity.price !== 'undefined' &&
          entity.price !== null &&
          entity.currency

        return (
          <div className="flex items-center gap-2">
            <span className="truncate">{item.label}</span>
            {hasPrice && (
              <span className="text-xs text-muted-foreground">
                {(Number(entity.price ?? 0) / 100).toFixed(2)} {entity.currency}
              </span>
            )}
          </div>
        )
      }}
    />
  )
}
