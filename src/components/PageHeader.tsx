import { useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from './ui/button'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { useMobileReadonly } from '@/hooks/useMobileReadonly'

export type IconType = ComponentType<SVGProps<SVGSVGElement>>

export interface BreadcrumbItem {
  label: string
  to?: string
  onClick?: () => void
}

export interface PageHeaderProps {
  title?: string
  description?: string
  /** Optional: breadcrumb trail */
  breadcrumbs?: Array<BreadcrumbItem>

  /** Optional: Right-side action buttons (Add, Save, Export, etc.) */
  actions?: ReactNode
  /** Allows rendering actions on mobile even in mobile read-only mode */
  showActionsOnMobile?: boolean

  /** If true, shows a back button (detail pages) */
  showBack?: boolean

  /** Override the back icon */
  backIcon?: IconType
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  showActionsOnMobile = false,
  showBack = true,
  backIcon: BackIconProp,
}: PageHeaderProps) {
  const router = useRouter()
  const BackIcon = BackIconProp ?? ArrowLeft
  const isMobileReadonly = useMobileReadonly()

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {showBack && (
          <Button
            variant="link"
            onClick={() => router.history.back()}
            className="w-12 rounded-md border border-b-sidebar-border"
            aria-label="Back"
          >
            <BackIcon className="size-5" />
          </Button>
        )}

        <div className="flex flex-1 items-center justify-between">
          <div>
            <h2 className="text-xl font-bold capitalize">{title}</h2>
            {description && <p className="text-sm font-light">{description}</p>}
          </div>
          {(!isMobileReadonly || showActionsOnMobile) && actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </div>
      </div>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((bc, idx) => {
            const isLast = idx === breadcrumbs.length - 1
            return (
              <span key={idx} className="flex items-center gap-2">
                {bc.to ? (
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={
                      bc.onClick ?? (() => router.navigate({ to: bc.to! }))
                    }
                  >
                    {bc.label}
                  </Button>
                ) : (
                  <span className="font-semibold">{bc.label}</span>
                )}
                {!isLast && <span>/</span>}
              </span>
            )
          })}
        </nav>
      )}
    </header>
  )
}
