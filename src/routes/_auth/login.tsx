import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { useForm } from '@tanstack/react-form'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLoginMutation } from '@/lib/mutations/auth'
import { useFormErrors } from '@/hooks/useFormErrors'
import { useFormErrorMessage } from '@/hooks/useFormErrorMessage'

export const Route = createFileRoute('/_auth/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation()
  const { t: tValidation } = useTranslation('validation')
  const formErrors = useFormErrors()
  const formErrorMessage = useFormErrorMessage(formErrors.errors)
  const loginMutation = useLoginMutation(undefined, formErrors)

  const form = useForm({
    defaultValues: {
      username: import.meta.env.DEV ? 'rafet' : '',
      password: import.meta.env.DEV ? '123456' : '',
    },
    validators: {
      onChange: z.object({
        username: z
          .string()
          .min(3, tValidation('min_length', { min: 3 })),
        password: z
          .string()
          .min(6, tValidation('min_length', { min: 6 })),
      }),
    },
    onSubmit: ({ value }) => {
      formErrors.clearForm()
      loginMutation.mutate(value)
    },
  })

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-lg font-semibold">
          {t('title')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          {formErrorMessage && (
            <div className="flex gap-3 p-3 rounded-md bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  {formErrorMessage}
                </p>
              </div>
            </div>
          )}

          <FieldGroup>
            <form.Field
              name="username"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                const fieldError = formErrors.errors.username
                const hasError = isInvalid || !!fieldError
                return (
                  <Field data-invalid={hasError}>
                    <FieldLabel htmlFor={field.name}>
                      {t('username')}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        formErrors.clearField('username')
                      }}
                      aria-invalid={hasError}
                      placeholder={t('username')}
                      autoComplete="username"
                    />
                    {hasError && (
                      <FieldError>
                        {isInvalid && field.state.meta.errors[0]?.message}
                        {fieldError &&
                          !isInvalid &&
                          tCommon(
                            `${fieldError.i18n.ns}:${fieldError.i18n.key}`,
                            fieldError.params,
                          )}
                      </FieldError>
                    )}
                  </Field>
                )
              }}
            />

            <form.Field
              name="password"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                const fieldError = formErrors.errors.password
                const hasError = isInvalid || !!fieldError
                return (
                  <Field data-invalid={hasError}>
                    <FieldLabel htmlFor={field.name}>
                      {t('password')}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        formErrors.clearField('password')
                      }}
                      aria-invalid={hasError}
                      placeholder={t('password')}
                      autoComplete="current-password"
                      type="password"
                    />
                    {hasError && (
                      <FieldError>
                        {isInvalid && field.state.meta.errors[0]?.message}
                        {fieldError &&
                          !isInvalid &&
                          tCommon(
                            `${fieldError.i18n.ns}:${fieldError.i18n.key}`,
                            fieldError.params,
                          )}
                      </FieldError>
                    )}
                  </Field>
                )
              }}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('logging_in')}
                </span>
              ) : (
                t('login')
              )}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
