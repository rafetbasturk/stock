import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { createProduct, removeProduct, updateProduct } from '@/server/products'
import { toast } from 'sonner'
import { useFormMutation } from '@/hooks/useFormMutation'
import { productQueryKeys } from '../queries/products'
import { MutationFormErrors } from '../types/types.form'

export const invalidateProductQueries = async (qc: QueryClient) =>
  await Promise.all([
    qc.invalidateQueries({ queryKey: productQueryKeys.lists() }),
    qc.invalidateQueries({ queryKey: productQueryKeys.paginatedLists() }),
    qc.invalidateQueries({ queryKey: productQueryKeys.filterOptions() }),
  ])

export function useCreateProductMutation(
  onSuccess?: (data: any) => void,
  formErrors?: MutationFormErrors,
) {
  const qc = useQueryClient()
  const createProductFn = useServerFn(createProduct)

  return useFormMutation({
    mutationFn: (data: Parameters<typeof createProductFn>[0]['data']) =>
      createProductFn({ data }),

    formErrorCodes: ['VALIDATION_ERROR', 'INVALID_ID', 'PRODUCT_NOT_FOUND'],

    onFieldError: formErrors?.setAllErrors,

    // Optimistic: just reset errors, invalidate will happen onSuccess
    onOptimistic: () => {
      formErrors?.resetErrors()
    },

    onSuccess: async (newProduct) => {
      await invalidateProductQueries(qc)
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

    onSuccess: async (_, variables) => {
      await invalidateProductQueries(qc)

      qc.removeQueries({
        queryKey: productQueryKeys.detail(variables.id),
      })
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

    onSuccess: async (updatedProduct) => {
      await invalidateProductQueries(qc)
      await qc.setQueryData(
        productQueryKeys.detail(updatedProduct.id),
        updatedProduct,
      )
      toast.success('Ürün başarıyla güncellendi')
      onSuccess?.(updatedProduct)
    },
  })
}
