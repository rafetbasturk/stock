import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import EntitySelect from './EntitySelect'
import type { I18nErrorMessage } from '@/lib/error/core/errorTransport'
import type { FieldErrors } from '@/lib/error/utils/formErrors'
import { useFetchCustomers } from '@/lib/queries/customers'

type Props = {
  value: number | null
  onValueChange: (id: number | null) => void
  error?: I18nErrorMessage | string
  onErrorChange?: React.Dispatch<React.SetStateAction<FieldErrors>>
  required?: boolean
  label?: string
  includeAllOption?: boolean
  filterIds?: Array<number>
  distinct?: boolean
}

export default function CustomerInput({
  value,
  onValueChange,
  error,
  onErrorChange,
  required = false,
  label,
  includeAllOption = false,
  filterIds,
  distinct = false,
}: Props) {
  const { t } = useTranslation('entities')
  const { data: customers, isLoading } = useFetchCustomers({ distinct })

  const filtered = useMemo(() => {
    if (!customers) return []
    if (!filterIds) return customers
    return customers.filter((c) => filterIds.includes(c.id))
  }, [customers, filterIds])

  const customerOptions = filtered.map((c) => ({
    id: c.id,
    label: `${c.code} - ${c.name}`,
  }))

  // --- Auto-select if only 1 available ---
  useEffect(() => {
    if (filtered.length === 1 && !value) {
      onValueChange(filtered[0].id)
    }
  }, [filtered, value, onValueChange])

  const options = includeAllOption
    ? [
        {
          id: 'all',
          label: t('customers.all'),
          value: 'all',
          returnValue: null,
        },
        ...customerOptions,
      ]
    : customerOptions

  return (
    <EntitySelect
      name="customer_id"
      label={label}
      placeholder={t('customers.all_customers')}
      value={value}
      onValueChange={onValueChange}
      error={error}
      onErrorChange={onErrorChange}
      required={required}
      loading={isLoading}
      options={options}
    />
  )
}
