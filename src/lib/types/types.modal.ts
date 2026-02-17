import { MovementRow } from "@/types"

export type HistoryModalState = {
  type: 'closed' | 'editing' | 'deleting'
  movement: MovementRow | null
}