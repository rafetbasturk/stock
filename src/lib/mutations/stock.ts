import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteStockMovement, updateStockMovement } from '@/server/stock'
import { stockQueryKeys } from '../queries/stock'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useDeleteStockMovement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('stock')

  return useMutation({
    mutationFn: (id: number) => deleteStockMovement({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      toast.success(t('delete_success'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('delete_failed'))
    },
  })
}

export function useUpdateStockMovement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('stock')

  return useMutation({
    mutationFn: (data: { id: number; quantity?: number; notes?: string }) =>
      updateStockMovement({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      toast.success(t('update_success'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('update_failed'))
    },
  })
}
