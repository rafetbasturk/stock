import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { deliveryQueryKeys } from '../queries/deliveries'
import { orderQueryKeys } from '../queries/orders'
import type { MutationFormErrors } from '@/lib/types'
import { createDelivery, removeDelivery } from '@/server/deliveries'
import { useFormMutation } from '@/hooks/useFormMutation'

export function useCreateDeliveryMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const createDeliveryFn = useServerFn(createDelivery)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof createDeliveryFn>[0]['data']) =>
      createDeliveryFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID'],

    onFieldError: formErrors?.setAllErrors,

    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: (newDelivery) => {
      qc.invalidateQueries({ queryKey: deliveryQueryKeys.lists() })
      qc.invalidateQueries({ queryKey: deliveryQueryKeys.lastNumber() })
      qc.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      qc.invalidateQueries({ queryKey: orderQueryKeys.details() })
      toast.success('Teslimat başarıyla oluşturuldu')
      onSuccess?.(newDelivery)
    },
  })
}

export function useDeleteDeliveryMutation(onSuccess?: () => void) {
  const qc = useQueryClient()
  const removeDeliveryFn = useServerFn(removeDelivery)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof removeDeliveryFn>[0]['data']) =>
      removeDeliveryFn({ data }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryQueryKeys.lists() })
      qc.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      qc.invalidateQueries({ queryKey: orderQueryKeys.details() })
      toast.success('Teslimat silindi')
      onSuccess?.()
    },
  })
}

// export function useUpdateDeliveryMutation(
//   onSuccess?: (data: any) => void,
//   formErrors?: MutationFormErrors,
// ) {
//   const qc = useQueryClient()
//   const updateDeliveryFn = useServerFn(updateDelivery)

//   return useFormMutation({
//     mutationFn: (data: { id: number; data: DeliveryWithItems }) =>
//       updateDeliveryFn({ data }),

//     formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID', 'DELIVERY_NOT_FOUND'],

//     onFieldError: formErrors?.setAllErrors,

//     onOptimistic: () => {
//       formErrors?.resetErrors()
//     },

//     onSuccess: (updatedDelivery) => {
//       if (!updatedDelivery) return
//       qc.setQueryData(deliveryQueryKeys.detail(updatedDelivery.id), updatedDelivery)
//       qc.invalidateQueries({ queryKey: deliveryQueryKeys.lists(), refetchType: 'active', })
//       toast.success('Sipariş başarıyla güncellendi')
//       onSuccess?.(updatedDelivery)
//     },
//   })
// }
