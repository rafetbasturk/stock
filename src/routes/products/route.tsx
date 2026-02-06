// src/routes/products/route.tsx
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { LucideListOrdered } from 'lucide-react'

export const Route = createFileRoute('/products')({
  component: ProductsLayout,
  pendingComponent: () => (
    <LoadingSpinner variant="full-page" text="Loading products..." />
  ),
  staticData: {
    sidebar: {
      label: 'Ürünler',
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
