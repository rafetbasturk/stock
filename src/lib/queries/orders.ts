// src/lib/queries/orders.ts
import { getYearRange } from "@/server/orders";
import { queryOptions } from "@tanstack/react-query";

export const yearRangeQuery = queryOptions({
  queryKey: ["year-range"],
  queryFn: getYearRange,
});
