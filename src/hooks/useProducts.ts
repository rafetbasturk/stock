import { useQuery } from '@tanstack/react-query'
import { selectProductsQuery } from '@/lib/queries/products'

export function useSelectProducts() {
  return useQuery(selectProductsQuery)
}
