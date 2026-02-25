import { useTranslation } from 'react-i18next'
import type { ElementType, PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

export function DetailItem({
  children,
  label,
  value,
  icon: Icon,
  className,
  highlight,
}: PropsWithChildren & {
  label: string
  value?: string | number | null
  icon: ElementType
  className?: string
  highlight?: boolean
}) {
  const { t } = useTranslation('details')

  const displayValue =
    children ??
    (value !== null && value !== undefined && value !== '' ? value : null)

  return (
    <div className={cn('flex flex-col gap-1 min-w-0', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" />

        <span className="text-[10px] font-semibold uppercase tracking-wide truncate">
          {label}
        </span>
      </div>

      <div
        className={cn(
          'text-sm wrap-break-word',
          highlight && 'text-primary font-bold text-base',
        )}
      >
        {displayValue ?? (
          <span className="italic text-muted-foreground/50">
            {t('common.empty')}
          </span>
        )}
      </div>
    </div>
  )
}
