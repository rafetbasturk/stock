import { useMutation } from "@tanstack/react-query";
import { AppError } from "@/lib/error/core";
import { MutationFormErrors } from "@/lib/types";

type UseFormMutationOptions<TData, TResult> = {
  mutationFn: (data: TData) => Promise<TResult>;
  formErrorCodes?: string[];

  onFieldError?: MutationFormErrors["setAllErrors"];
  onOptimistic?: () => void;
  onRollback?: () => void;
  onSuccess?: (result: TResult) => void;
};

export function useFormMutation<TData, TVariables>({
  mutationFn,
  onSuccess,
  onFieldError,
  formErrorCodes = [],
  onOptimistic,
  onRollback,
}: UseFormMutationOptions<TData, TVariables>) {
  return useMutation({
    mutationFn,

    onMutate: async () => {
      onOptimistic?.();
    },

    onSuccess,

    onError: (error) => {
      onRollback?.();

      const appError = AppError.from(error);

      console.error(appError.details);

      // 1️⃣ Validation → field errors
      if (
        appError.code === "VALIDATION_ERROR" &&
        appError.details &&
        typeof appError.details === "object" &&
        appError.details.type === "validation"
      ) {
        onFieldError?.(appError.details.fieldErrors);
        return;
      }

      // 2️⃣ Domain/form errors
      if (formErrorCodes.includes(appError.code)) {
        (error as any).__handledBySafeMutation = true;

        onFieldError?.({
          _form: {
            i18n: {
              ns: "formErrors",
              key: appError.code,
            },
          },
        });
        return;
      }
    },
  });
}
