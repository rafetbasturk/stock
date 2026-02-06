// src/lib/queries/customers.ts
import { getCustomers } from "@/server/customers";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const fetchCustomers = queryOptions({
  queryKey: ["customers"],
  queryFn: getCustomers,
  staleTime: 1000 * 60 * 10,
});

export function useFetchCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
    staleTime: 1000 * 60 * 10,
  });
}
