import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import type { MutationFormErrors } from '@/lib/types'
import type { OrderSubmitPayload } from '@/types'
import { useFormMutation } from '@/hooks/useFormMutation'
import { createOrder, removeOrder, updateOrder } from '@/server/orders'

export function useCreateOrderMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const createOrderFn = useServerFn(createOrder)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof createOrderFn>[0]['data']) =>
      createOrderFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID'],

    onFieldError: formErrors?.setAllErrors,

    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: (newOrder) => {
      qc.invalidateQueries({ queryKey: ['orders', 'list'] })
      toast.success('Sipariş başarıyla oluşturuldu')
      onSuccess?.(newOrder)
    },
  })
}

export function useDeleteOrderMutation(onSuccess?: () => void) {
  const qc = useQueryClient()
  const removeOrderFn = useServerFn(removeOrder)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof removeOrderFn>[0]['data']) =>
      removeOrderFn({ data }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', 'list'] })
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

    onSuccess: (updatedOrder) => {
      if (!updatedOrder) return
      qc.setQueryData(['orders', 'detail', updatedOrder.id], updatedOrder)
      qc.invalidateQueries({ queryKey: ['orders', 'list'] })
      toast.success('Sipariş başarıyla güncellendi')
      onSuccess?.(updatedOrder)
    },
  })
}
