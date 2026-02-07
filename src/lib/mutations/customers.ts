import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import type { MutationFormErrors } from '@/lib/types'
import { useFormMutation } from '@/hooks/useFormMutation'
import {
  createCustomer,
  removeCustomer,
  updateCustomer,
} from '@/server/customers'

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

    onSuccess: (newCustomer) => {
      // Invalidate the customers list to refetch with new data
      // The keepPreviousData option keeps old data visible during refetch
      qc.invalidateQueries({ queryKey: ['customers', 'list'] })

      // Show success immediately (don't wait for refetch)
      toast.success('Müşteri başarıyla oluşturuldu')
      onSuccess?.(newCustomer)
    },
  })
}

export function useDeleteCustomerMutation(onSuccess?: () => void) {
  const qc = useQueryClient()
  const removeCustomerFn = useServerFn(removeCustomer)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof removeCustomerFn>[0]['data']) =>
      removeCustomerFn({ data }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers', 'list'] })
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

    onSuccess: (updatedCustomer) => {
      // Update the specific customer detail query immediately with returned data
      // This makes the detail view update instantly without refetching
      qc.setQueryData(
        ['customers', 'detail', updatedCustomer.id],
        updatedCustomer,
      )

      // Also invalidate the customers list so it refreshes in background
      qc.invalidateQueries({ queryKey: ['customers', 'list'] })

      // Show success immediately (don't wait for list refetch)
      toast.success('Müşteri başarıyla güncellendi')
      onSuccess?.(updatedCustomer)
    },
  })
}
