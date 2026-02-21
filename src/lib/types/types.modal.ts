import { MovementRow } from '@/types'

export type ModalState<T> =
  | { type: 'closed' }
  | { type: 'adding' }
  | { type: 'editing'; item: T }
  | { type: 'deleting'; item: T }
  | { type: 'adjusting'; item: T }

export type HistoryModalState = {
  type: 'closed' | 'editing' | 'deleting'
  movement: MovementRow | null
}
