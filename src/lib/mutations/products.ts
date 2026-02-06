import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { createProduct, removeProduct, updateProduct } from '@/server/products'
import { toast } from 'sonner'
import { useFormMutation } from '@/hooks/useFormMutation'
import { MutationFormErrors } from '@/lib/types'

export function useCreateProductMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const createProductFn = useServerFn(createProduct)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof createProductFn>[0]['data']) =>
      createProductFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID'],

    onFieldError: formErrors?.setAllErrors,

    // Optimistic: just reset errors, invalidate will happen onSuccess
    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: (newProduct) => {
      // Invalidate the products list to refetch with new data
      // The keepPreviousData option keeps old data visible during refetch
      qc.invalidateQueries({ queryKey: ['products', 'list'] })

      // Show success immediately (don't wait for refetch)
      toast.success('Ürün başarıyla oluşturuldu')
      onSuccess?.(newProduct)
    },
  })
}

export function useDeleteProductMutation(onSuccess?: () => void) {
  const qc = useQueryClient()
  const removeProductFn = useServerFn(removeProduct)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof removeProductFn>[0]['data']) =>
      removeProductFn({ data }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', 'list'] })
      toast.success('Ürün silindi')
      onSuccess?.()
    },
  })
}

export function useUpdateProductMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const updateProductFn = useServerFn(updateProduct)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof updateProductFn>[0]['data']) =>
      updateProductFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID', 'PRODUCT_NOT_FOUND'],

    onFieldError: formErrors?.setAllErrors,

    // Optimistic: just reset errors - actual cache updates happen onSuccess
    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: (updatedProduct) => {
      // Update the specific product detail query immediately with returned data
      // This makes the detail view update instantly without refetching
      qc.setQueryData(['products', 'detail', updatedProduct.id], updatedProduct)

      // Also invalidate the products list so it refreshes in background
      qc.invalidateQueries({ queryKey: ['products', 'list'] })

      // Show success immediately (don't wait for list refetch)
      toast.success('Ürün başarıyla güncellendi')
      onSuccess?.(updatedProduct)
    },
  })
}
