import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { deliveryQueryKeys } from '../queries/deliveries'
import type { MutationFormErrors } from '@/lib/types'
import {
  createDelivery,
  removeDelivery,
  updateDelivery,
} from '@/server/deliveries'
import { useFormMutation } from '@/hooks/useFormMutation'

type ServerFnData<T extends (...args: any) => any> = Parameters<T>[0]['data']

export const invalidateDeliveryQueries = async (qc: QueryClient) =>
  await Promise.all([
    qc.invalidateQueries({ queryKey: deliveryQueryKeys.lists() }),
    qc.invalidateQueries({ queryKey: deliveryQueryKeys.paginatedLists() }),
    qc.invalidateQueries({ queryKey: deliveryQueryKeys.lastNumber() }),
    qc.invalidateQueries({ queryKey: deliveryQueryKeys.filterOptions() }),
  ])

export function useCreateDeliveryMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const createDeliveryFn = useServerFn(createDelivery)

  return useFormMutation({
    mutationFn: (data: ServerFnData<typeof createDeliveryFn>) =>
      createDeliveryFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID'],

    onFieldError: formErrors?.setAllErrors,

    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: async (newDelivery) => {
      await invalidateDeliveryQueries(qc)
      toast.success('Teslimat başarıyla oluşturuldu')
      onSuccess?.(newDelivery)
    },
  })
}

export function useDeleteDeliveryMutation(onSuccess?: () => void) {
  const qc = useQueryClient()
  const removeDeliveryFn = useServerFn(removeDelivery)

  return useFormMutation({
    mutationFn: (data: ServerFnData<typeof removeDeliveryFn>) =>
      removeDeliveryFn({ data }),

    onSuccess: async (_, variables) => {
      await invalidateDeliveryQueries(qc)

      qc.removeQueries({
        queryKey: deliveryQueryKeys.detail(variables.id),
      })
      toast.success('Teslimat silindi')
      onSuccess?.()
    },
  })
}

export function useUpdateDeliveryMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const updateDeliveryFn = useServerFn(updateDelivery)

  return useFormMutation({
    mutationFn: (variables: ServerFnData<typeof updateDeliveryFn>) =>
      updateDeliveryFn({ data: variables }),

    formErrorCodes: [
      'VALIDATION_ERROR',
      'INVALID_ID',
      'DELIVERY_NOT_FOUND',
      'INSUFFICIENT_STOCK',
    ],

    onFieldError: formErrors?.setAllErrors,

    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: async (updatedDelivery) => {
      if (!updatedDelivery) return

      qc.setQueryData(
        deliveryQueryKeys.detail(updatedDelivery.id),
        updatedDelivery,
      )

      await invalidateDeliveryQueries(qc)

      toast.success('Teslimat başarıyla güncellendi')

      onSuccess?.(updatedDelivery)
    },
  })
}
