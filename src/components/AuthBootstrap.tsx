import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { meQuery } from "@/lib/queries/auth";
import { authStoreApi } from "@/stores/authStore";

export function AuthBootstrap() {
  const { data, isLoading } = useQuery(meQuery);

  React.useEffect(() => {
    const store = authStoreApi.getState();

    if (isLoading) {
      if (store.authStatus !== "pending") {
        store.setAuthStatus("pending");
      }
      return;
    }

    store.setUser(data ?? null);
  }, [data, isLoading]);

  return null;
}
