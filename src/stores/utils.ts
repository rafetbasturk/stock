import type { StoreApi, UseBoundStore } from "zustand";

type WithSelectors<TStore> = TStore extends { getState: () => infer TState }
  ? TStore & { use: { [TKey in keyof TState]: () => TState[TKey] } }
  : never;

export const createSelectors = <TStore extends UseBoundStore<StoreApi<object>>>(
  _store: TStore
) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};
