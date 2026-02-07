import { useMutation } from "@tanstack/react-query";
import type { MutationFormErrors } from "@/lib/types";
import { AppError } from "@/lib/error/core";

type UseFormMutationOptions<TData, TResult> = {
  mutationFn: (data: TData) => Promise<TResult>;
  formErrorCodes?: Array<string>;

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

    onMutate: () => {
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
        typeof appError.details === "object"
      ) {
        (error as any).__handledBySafeMutation = true;
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
