import { ListPageLayout } from './layout/ListPageLayout'
import { Skeleton } from './ui/skeleton'

export function ListPendingComponent() {
  return (
    <ListPageLayout
      header={
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-12 w-12 rounded-md" />
        </div>
      }
    >
      <div className="border rounded-lg shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="rounded-md border p-2 md:p-4 space-y-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton
              key={`orders-pending-row-${index}`}
              className="h-10 w-full"
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-14" />
            <Skeleton className="h-9 w-14" />
            <Skeleton className="h-9 w-14" />
          </div>
        </div>
      </div>
    </ListPageLayout>
  )
}
