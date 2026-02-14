import { useQueryClient } from '@tanstack/react-query'
import { deleteStockMovement, updateStockMovement } from '@/server/stock'
import { stockQueryKeys } from '../queries/stock'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useFormMutation } from '@/hooks/useFormMutation'

export function useDeleteStockMovement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('stock')

  return useFormMutation<number, { success: true }>({
    mutationFn: (id: number) => deleteStockMovement({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      toast.success(t('delete_success'))
    },
  })
}

export function useUpdateStockMovement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('stock')

  return useFormMutation<
    { id: number; quantity?: number; notes?: string },
    { success: true }
  >({
    mutationFn: (data: { id: number; quantity?: number; notes?: string }) =>
      updateStockMovement({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      toast.success(t('update_success'))
    },
  })
}
