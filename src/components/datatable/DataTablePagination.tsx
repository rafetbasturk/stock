import { useTranslation } from 'react-i18next'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DataTablePaginationProps {
  total: number
  serverPageIndex: number
  serverPageSize: number
  pageCount: number
  activeFilters: Array<string>
  onServerPageChange: (p: number) => void
  onServerPageSizeChange: (s: number) => void
}

export default function DataTablePagination({
  total,
  serverPageIndex,
  serverPageSize,
  pageCount,
  activeFilters,
  onServerPageChange,
  onServerPageSizeChange,
}: DataTablePaginationProps) {
  const { t } = useTranslation('table')

  return (
    <div className="flex justify-end gap-6 items-center pt-2 text-xs md:text-sm">
      <div className="text-muted-foreground flex-1 text-sm lg:flex">
        {t('records_count', { count: total })}
        {activeFilters.length > 0 && ` (${activeFilters.join(', ')})`}
      </div>

      <div className="hidden lg:flex items-center gap-2">
        <Label>{t('rows_per_page')}</Label>
        <Select
          value={String(serverPageSize)}
          onValueChange={(v) => onServerPageSizeChange(Number(v))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[20, 50, 100].map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        {t('page_status', {
          current: serverPageIndex + 1,
          total: pageCount,
        })}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={serverPageIndex === 0}
          onClick={() => onServerPageChange(0)}
          size="icon-sm"
        >
          <ChevronsLeftIcon />
        </Button>

        <Button
          variant="outline"
          disabled={serverPageIndex === 0}
          onClick={() => onServerPageChange(serverPageIndex - 1)}
          size="icon-sm"
        >
          <ChevronLeftIcon />
        </Button>

        <Button
          variant="outline"
          disabled={serverPageIndex >= pageCount - 1}
          onClick={() => onServerPageChange(serverPageIndex + 1)}
          size="icon-sm"
        >
          <ChevronRightIcon />
        </Button>

        <Button
          variant="outline"
          disabled={serverPageIndex >= pageCount - 1}
          onClick={() => onServerPageChange(pageCount - 1)}
          size="icon-sm"
        >
          <ChevronsRightIcon />
        </Button>
      </div>
    </div>
  )
}
