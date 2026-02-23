import { cn } from "@/lib/utils"
import { Separator } from "./ui/separator"

export function StatBlock({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase text-muted-foreground">
        {label}
      </span>

      <Separator />

      <span
        className={cn('font-semibold text-center', highlight && 'text-primary')}
      >
        {value}
      </span>
    </div>
  )
}
