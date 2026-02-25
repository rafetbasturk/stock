import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ListPageLayoutProps {
  header: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function ListPageLayout({
  header,
  children,
  className,
  contentClassName,
}: ListPageLayoutProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [contentHeight, setContentHeight] = useState<number | null>(null)

  useEffect(() => {
    const updateContentHeight = () => {
      const contentTop = contentRef.current?.getBoundingClientRect().top
      if (contentTop == null) return

      const viewportHeight = window.innerHeight
      const bottomPadding = 16
      const nextHeight = Math.max(240, Math.floor(viewportHeight - contentTop - bottomPadding))
      setContentHeight(nextHeight)
    }

    updateContentHeight()

    const resizeObserver = new ResizeObserver(updateContentHeight)
    if (contentRef.current?.parentElement) {
      resizeObserver.observe(contentRef.current.parentElement)
    }

    window.addEventListener('resize', updateContentHeight)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateContentHeight)
    }
  }, [])

  const contentStyle: CSSProperties | undefined =
    contentHeight == null ? undefined : { height: `${contentHeight}px` }

  return (
    <div className={cn('flex min-h-0 flex-col gap-6 overflow-hidden', className)}>
      <div className="shrink-0">{header}</div>
      <div
        ref={contentRef}
        className={cn('min-h-0 flex-1 overflow-hidden', contentClassName)}
        style={contentStyle}
      >
        {children}
      </div>
    </div>
  )
}
