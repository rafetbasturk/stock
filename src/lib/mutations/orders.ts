import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { orderQueryKeys } from '../queries/orders'
import type { QueryClient} from '@tanstack/react-query';
import type { OrderSubmitPayload } from '@/types'
import type { MutationFormErrors } from '../types/types.form'
import { createOrder, removeOrder, updateOrder } from '@/server/orders'
import { useFormMutation } from '@/hooks/useFormMutation'

type ServerFnData<T extends (...args: any) => any> = Parameters<T>[0]['data']

export const invalidateOrderQueries = async (qc: QueryClient) =>
  await Promise.all([
    qc.invalidateQueries({ queryKey: orderQueryKeys.lists() }),
    qc.invalidateQueries({ queryKey: orderQueryKeys.paginatedLists() }),
    qc.invalidateQueries({ queryKey: orderQueryKeys.lastNumber() }),
    qc.invalidateQueries({ queryKey: orderQueryKeys.filterOptions() }),
  ])

export function useCreateOrderMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const createOrderFn = useServerFn(createOrder)

  return useFormMutation({
    mutationFn: (data: ServerFnData<typeof createOrderFn>) =>
      createOrderFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID'],

    onFieldError: formErrors?.setAllErrors,

    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: async (newOrder) => {
      await invalidateOrderQueries(qc)
      toast.success('Sipariş başarıyla oluşturuldu')
      onSuccess?.(newOrder)
    },
  })
}

export function useDeleteOrderMutation(onSuccess?: () => void) {
  const qc = useQueryClient()
  const removeOrderFn = useServerFn(removeOrder)

  return useFormMutation({
    mutationFn: (data: ServerFnData<typeof removeOrderFn>) =>
      removeOrderFn({ data }),

    onSuccess: (_, variables) => {
      invalidateOrderQueries(qc)

      qc.removeQueries({
        queryKey: orderQueryKeys.detail(variables.id),
      })

      toast.success('Sipariş silindi')
      onSuccess?.()
    },
  })
}

export function useUpdateOrderMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const updateOrderFn = useServerFn(updateOrder)

  return useFormMutation({
    mutationFn: (data: { id: number; data: OrderSubmitPayload }) =>
      updateOrderFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID', 'ORDER_NOT_FOUND'],

    onFieldError: formErrors?.setAllErrors,

    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: async (updatedOrder) => {
      if (!updatedOrder) return

      await invalidateOrderQueries(qc)
      qc.invalidateQueries({
        queryKey: orderQueryKeys.deliveries(updatedOrder.id),
      })
      qc.setQueryData(orderQueryKeys.detail(updatedOrder.id), updatedOrder)

      toast.success('Sipariş başarıyla güncellendi')
      onSuccess?.(updatedOrder)
    },
  })
}
