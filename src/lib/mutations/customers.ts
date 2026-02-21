import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { useFormMutation } from '@/hooks/useFormMutation'
import {
  createCustomer,
  removeCustomer,
  updateCustomer,
} from '@/server/customers'
import { customerQueryKeys } from '../queries/customers'
import { MutationFormErrors } from '../types/types.form'

export const invalidateCustomerQueries = async (qc: QueryClient) =>
  await Promise.all([
    qc.invalidateQueries({ queryKey: customerQueryKeys.lists() }),
    qc.invalidateQueries({ queryKey: customerQueryKeys.paginatedLists() }),
  ])

export function useCreateCustomerMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const createCustomerFn = useServerFn(createCustomer)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof createCustomerFn>[0]['data']) =>
      createCustomerFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID'],

    onFieldError: formErrors?.setAllErrors,

    // Optimistic: just reset errors, invalidate will happen onSuccess
    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: async (newCustomer) => {
      await invalidateCustomerQueries(qc)
      toast.success('Müşteri başarıyla oluşturuldu')
      onSuccess?.(newCustomer)
    },
  })
}

type ServerFnData<T extends (...args: any) => any> = Parameters<T>[0]['data']

export function useDeleteCustomerMutation(onSuccess?: () => void) {
  const qc = useQueryClient()
  const removeCustomerFn = useServerFn(removeCustomer)

  return useFormMutation({
    mutationFn: (data: ServerFnData<typeof removeCustomerFn>) =>
      removeCustomerFn({ data }),

    onSuccess: async (_, variables) => {
      await invalidateCustomerQueries(qc)
      qc.removeQueries({
        queryKey: customerQueryKeys.detail(variables.id),
      })
      toast.success('Müşteri silindi')
      onSuccess?.()
    },
  })
}

export function useUpdateCustomerMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const updateCustomerFn = useServerFn(updateCustomer)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof updateCustomerFn>[0]['data']) =>
      updateCustomerFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID', 'CUSTOMER_NOT_FOUND'],

    onFieldError: formErrors?.setAllErrors,

    // Optimistic: just reset errors - actual cache updates happen onSuccess
    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: async (updatedCustomer) => {
      if (!updatedCustomer) return

      await invalidateCustomerQueries(qc)
      qc.setQueryData(
        customerQueryKeys.detail(updatedCustomer.id),
        updatedCustomer,
      )

      toast.success('Müşteri başarıyla güncellendi')
      onSuccess?.(updatedCustomer)
    },
  })
}
