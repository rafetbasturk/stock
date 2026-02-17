import { useQueryClient } from '@tanstack/react-query'
import { deleteStockMovement, updateStockMovement } from '@/server/stock'
import { stockQueryKeys } from '../queries/stock'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useFormMutation } from '@/hooks/useFormMutation'
import { useServerFn } from '@tanstack/react-start'

type ServerFnData<T extends (...args: any) => any> = Parameters<T>[0]['data']

export function useDeleteStockMovement() {
  const removeStockMovementFn = useServerFn(deleteStockMovement)
  const queryClient = useQueryClient()
  const { t } = useTranslation('stock')

  return useFormMutation({
    mutationFn: (data: ServerFnData<typeof removeStockMovementFn>) =>
      removeStockMovementFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      toast.success(t('delete_success'))
    },
  })
}

export function useUpdateStockMovement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('stock')
  const updateStockMovementFn = useServerFn(updateStockMovement)

  return useFormMutation({
    mutationFn: (data: { id: number; quantity?: number; notes?: string }) =>
      updateStockMovementFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      toast.success(t('update_success'))
    },
  })
}
