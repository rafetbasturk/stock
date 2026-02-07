import { useEffect, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import EntitySelect from './form/EntitySelect'
import type { Dispatch, SetStateAction } from 'react'
import type { FieldErrors } from '@/lib/error/utils/formErrors'
import { fetchCustomers } from '@/lib/queries/customers'

type Props = {
  value: number | null
  onValueChange: (id: number | null) => void
  error?: FieldErrors[string]
  onErrorChange?: Dispatch<SetStateAction<FieldErrors>>
  required?: boolean
  label?: string
  includeAllOption?: boolean
  filterIds?: Array<number>
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
}: Props) {
  const { data: customers, isLoading } = useSuspenseQuery(fetchCustomers)

  const filtered = useMemo(() => {
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
          label: 'Tümü',
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
      placeholder="Tüm müşteriler"
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
