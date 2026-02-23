export interface DataTableFilter {
  columnId: string
  label: string
  type: 'select' | 'multi' | 'daterange' | 'text'
  options?: { value: string; label: string }[]
}

export type TableSearch = Record<string, string | number | undefined>