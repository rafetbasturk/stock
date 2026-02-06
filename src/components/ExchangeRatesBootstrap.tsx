// src/components/ExchangeRatesBootstrap.tsx
import { useEffect } from "react";
import { exchangeRatesStore } from "@/stores/exchangeRatesStore";

export function ExchangeRatesBootstrap() {
  useEffect(() => {
    const run = () => {
      const { preferredCurrency, fetchExchangeRates } =
        exchangeRatesStore.getState();

      // do not force; let your shouldUpdateRates logic decide
      void fetchExchangeRates(preferredCurrency, false);
    };

    // If hydration already completed, run immediately
    if (exchangeRatesStore.persist?.hasHydrated?.()) {
      run();
      return;
    }

    // Otherwise wait until hydration finishes, then run once
    const unsub = exchangeRatesStore.persist?.onFinishHydration?.(() => {
      run();
    });

    // Defensive fallback (in case persist API isn't present for some reason)
    if (!unsub) run();

    return () => {
      unsub?.();
    };
  }, []);

  return null;
}
