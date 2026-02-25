import { Badge } from './ui/badge'
import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type Props = PropsWithChildren & {
  status?: string
  className?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export default function StatusBadge({
  status,
  className,
  children,
  variant,
}: Props) {
  let bgColor = ''

  switch (status) {
    case 'HAZIR':
      bgColor = 'bg-indigo-800 text-indigo-50'
      break
    case 'KISMEN HAZIR':
      bgColor = 'bg-indigo-600 text-indigo-100'
      break
    case 'ÜRETİM':
      bgColor = 'bg-orange-800 text-orange-50'
      break
    case 'KAYIT':
      bgColor = 'bg-stone-800 text-stone-50'
      break
    case 'BİTTİ':
      bgColor = 'bg-green-800 text-green-50'
      break
    default:
      bgColor = 'bg-slate-300 text-slate-900'
  }

  return (
    <Badge
      variant={variant}
      className={cn('capitalize', !variant && bgColor, className)}
    >
      {children ?? status ?? 'unknown'}
    </Badge>
  )
}
