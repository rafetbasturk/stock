// src/integrations/app-providers.tsx
import { Suspense, PropsWithChildren } from 'react'
import { ExchangeRatesBootstrap } from '../components/ExchangeRatesBootstrap'
import { AuthBootstrap } from '../components/AuthBootstrap'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      <ExchangeRatesBootstrap />
      <AuthBootstrap />
      <Suspense fallback={<LoadingSpinner variant="overlay" />}>
        {children}
      </Suspense>
    </>
  )
}
