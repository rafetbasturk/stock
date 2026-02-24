import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../ui/card'
import CustomerInput from '../form/CustomerInput'
import EntitySelect from '../form/EntitySelect'
import { Button } from '@/components/ui/button'
import type { HomeSearch } from '@/lib/types/types.search'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { useEffect, useState } from 'react'

interface Props {
  years: Array<string>
  filters: HomeSearch
  onSearchChange: (updates: Partial<HomeSearch>) => void
}

export default function DashboardFilters({
  years = [],
  filters,
  onSearchChange,
}: Props) {
  const { t } = useTranslation('dashboard')
  const { customerId, year } = filters
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<Partial<HomeSearch>>({
    customerId: customerId ?? undefined,
    year: year ?? undefined,
  })

  const yearOptions = [
    { id: 'all', label: t('filters.all'), value: '' },
    ...years.map((y) => ({
      id: String(y),
      label: String(y),
      value: String(y),
    })),
  ]

  useEffect(() => {
    if (!mobileFiltersOpen) return
    setDraftFilters({
      customerId: customerId ?? undefined,
      year: year ?? undefined,
    })
  }, [mobileFiltersOpen, customerId, year])

  const parseYear = (val: string | number | null) => {
    if (!val || val === 'all') return undefined
    const numericYear = typeof val === 'number' ? val : Number(val)
    return Number.isNaN(numericYear) ? undefined : numericYear
  }

  const renderFilterFields = (
    values: Partial<HomeSearch>,
    onCustomerChange: (value: number | null) => void,
    onYearChange: (value: string | null) => void,
  ) => (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="w-full md:w-40">
        <CustomerInput
          value={values.customerId ?? null}
          onValueChange={onCustomerChange}
          includeAllOption
          distinct={true}
        />
      </div>

      <div className="w-full md:w-40">
        <EntitySelect
          value={values.year ? String(values.year) : ''}
          onValueChange={onYearChange}
          options={yearOptions}
          placeholder={t('filters.all_years')}
        />
      </div>
    </div>
  )

  return (
    <div>
      <Card className="hidden md:block p-0 border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {renderFilterFields(
              { customerId, year },
              (id) => onSearchChange({ customerId: id ?? undefined }),
              (val) => onSearchChange({ year: parseYear(val) }),
            )}
            <Button
              variant="outline"
              onClick={() =>
                onSearchChange({ customerId: undefined, year: undefined })
              }
              className="w-full md:w-40 border-muted bg-background hover:bg-accent font-normal text-muted-foreground"
            >
              {t('filters.clear')}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="md:hidden flex gap-2 w-full">
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">{t('filters.trigger')}</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85%] sm:w-100">
            <SheetHeader>
              <SheetTitle>{t('filters.trigger')}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 p-4">
              {renderFilterFields(
                draftFilters,
                (id) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    customerId: id ?? undefined,
                  })),
                (val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    year: parseYear(val),
                  })),
              )}

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onSearchChange({
                      customerId: undefined,
                      year: undefined,
                    })

                    setMobileFiltersOpen(false)
                  }}
                  className="w-full"
                >
                  {t('filters.clear')}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    {t('filters.cancel')}
                  </Button>
                  <Button
                    onClick={() => {
                      onSearchChange({
                        customerId: draftFilters.customerId,
                        year: draftFilters.year,
                      })
                      setMobileFiltersOpen(false)
                    }}
                  >
                    {t('filters.apply')}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
