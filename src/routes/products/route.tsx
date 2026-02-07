// src/routes/products/route.tsx
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { LucideListOrdered } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export const Route = createFileRoute('/products')({
  component: ProductsLayout,
  pendingComponent: ProductsLayoutPending,
  staticData: {
    sidebar: {
      label: 'nav.products',
      icon: LucideListOrdered,
      order: 30,
    },
  },
})

function ProductsLayout() {
  return (
    <div className="p-2 md:p-6">
      <Outlet />
    </div>
  )
}

function ProductsLayoutPending() {
  const { t } = useTranslation('entities')
  return <LoadingSpinner variant="full-page" text={t('products.loading')} />
}
