// src/components/form/MultiSelectFilter.tsx

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

import { Button } from '../ui/button'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { useTranslation } from 'react-i18next'

export interface MultiSelectFilterProps {
  filter: {
    columnId: string
    label: string
    options: { value: string; label: string }[]
  }

  selectedValues: string[]

  onChange: (columnId: string, selectedValues: string[]) => void
}

export function MultiSelectFilter({
  filter,
  selectedValues,
  onChange,
}: MultiSelectFilterProps) {
  const { t } = useTranslation("table")
  const [open, setOpen] = useState(false)

  const allValues = filter.options.map((o) => o.value)

  const isAllSelected =
    selectedValues.length === 0 || selectedValues.length === allValues.length

  function toggleValue(value: string) {
    let next: string[]

    if (value === '__all__') {
      next = []
    } else if (selectedValues.includes(value)) {
      next = selectedValues.filter((v) => v !== value)
    } else {
      next = [...selectedValues, value]
    }

    if (next.length === allValues.length) {
      next = []
    }

    onChange(filter.columnId, next)
  }

  function getLabel() {
    if (isAllSelected) return filter.label

    if (selectedValues.length === 1) {
      const opt = filter.options.find((o) => o.value === selectedValues[0])
      return opt?.label ?? filter.label
    }

    return `${selectedValues.length} ${t('selected')}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="justify-between w-full md:w-48 font-normal text-muted-foreground"
        >
          {getLabel()}
          <ChevronDown className="ml-2 size-4 text-muted-foreground opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder={`${filter.label} ara...`} />

          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>

            <CommandGroup>
              {/* All */}

              <CommandItem
                value="__all__"
                onSelect={() => toggleValue('__all__')}
              >
                <Checkbox checked={isAllSelected} />
                Tümü
              </CommandItem>

              {filter.options.map((option) => {
                const checked = selectedValues.includes(option.value)

                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggleValue(option.value)}
                  >
                    <Checkbox checked={checked} />

                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`
        mr-2 h-4 w-4 rounded border flex items-center justify-center
        ${checked ? 'bg-primary border-primary' : 'border-muted'}
      `}
    >
      {checked && <div className="h-2 w-2 bg-white rounded-sm" />}
    </div>
  )
}
