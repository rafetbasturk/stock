// src/stores/exchangeRatesStore.ts
import { createWithEqualityFn } from "zustand/traditional";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createSelectors } from "./utils";
import {
  fallbackRates,
  shouldUpdateRates,
  transformRates,
  currencyArray,
  fetchRatesForCurrency,
  type Rate,
} from "@/lib/currency";
import type { Currency } from "@/types";

type ExchangeRatesState = {
  rates: Rate[];
  lastUpdated: number | null;
  isLoading: boolean;
  error: string | null;
  preferredCurrency: Currency;
  hasHydrated: boolean;
};

type ExchangeRatesActions = {
  fetchExchangeRates: (base?: Currency, force?: boolean) => Promise<void>;
  getRatesFor: (currency: Currency) => Record<string, number>;
  setPreferredCurrency: (currency: Currency) => Promise<void>;
  setHasHydrated: (v: boolean) => void;
};

const initialState: ExchangeRatesState = {
  rates: fallbackRates,
  lastUpdated: null,
  isLoading: false,
  error: null,
  preferredCurrency: "TRY",
  hasHydrated: false,
};

// SSR-safe storage
const storage = createJSONStorage(() => {
  if (typeof window !== "undefined") return localStorage;
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  } as any;
});

const baseStore = createWithEqualityFn<
  ExchangeRatesState & ExchangeRatesActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      fetchExchangeRates: async (base?: Currency, force = false) => {
        const { lastUpdated, preferredCurrency, isLoading } = get();
        const targetBase = base ?? preferredCurrency;

        if (isLoading) return;
        if (!force && !shouldUpdateRates(lastUpdated)) return;

        set({ isLoading: true, error: null });

        try {
          const baseRates = await fetchRatesForCurrency(targetBase);
          const filteredRates = baseRates.filter((rate) =>
            currencyArray.includes(rate.targetCurrency)
          );

          set({
            rates: filteredRates,
            lastUpdated: Date.now(),
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            isLoading: false,
            error:
              err instanceof Error
                ? err.message
                : "Failed to fetch exchange rates",
          });
        }
      },

      getRatesFor: (currency: Currency) => {
        const { rates } = get();
        return transformRates(rates, currency);
      },

      setPreferredCurrency: async (currency: Currency) => {
        const { preferredCurrency, fetchExchangeRates } = get();
        if (currency === preferredCurrency) return;

        await fetchExchangeRates(currency, true);
        set({ preferredCurrency: currency });
      },
    }),
    {
      name: "exchange-rates-storage",
      storage,
      partialize: (state) => ({
        rates: state.rates,
        lastUpdated: state.lastUpdated,
        preferredCurrency: state.preferredCurrency,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  ),
  shallow
);

// Export BOTH: (1) hook selectors, (2) base store for imperative bootstrap if needed
export const exchangeRatesStore = baseStore;
export const useExchangeRatesStore = createSelectors(baseStore);
