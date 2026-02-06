// src/lib/queries/products.ts
import {
  getPaginated,
  getProductById,
  getProductFilterOptions,
} from "@/server/products";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { ProductsSearch } from "../types/types.search";

function toMaterialArray(material?: string) {
  if (!material) return undefined;
  const parts = material
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

// Optional: canonical key so order doesn't matter (e.g. "B|A" equals "A|B")
function materialKey(material?: string) {
  const arr = toMaterialArray(material);
  return arr ? [...arr].sort().join("|") : "";
}

function toCustomerId(customer?: string) {
  if (!customer) return undefined;
  const id = Number(customer);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

export const productsQueryKey = (s: ProductsSearch) =>
  [
    "products",
    "list",
    s.pageIndex ?? 0,
    s.pageSize ?? 100,
    s.q ?? "",
    s.sortBy ?? "code",
    s.sortDir ?? "asc",
    materialKey(s.material), // ✅ always a string
    s.customer ?? "",
  ] as const;

export const productsQuery = (search: ProductsSearch) =>
  queryOptions({
    queryKey: productsQueryKey(search),
    queryFn: () =>
      getPaginated({
        data: {
          ...search,
          material: toMaterialArray(search.material),
          customer: toCustomerId(search.customer),
        },
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });

export const productQuery = (id: number) =>
  queryOptions({
    queryKey: ["products", "detail", id],
    queryFn: () => getProductById({ data: { id } }),
  });

export const getFilterOptions = () =>
  queryOptions({
    queryKey: ["products-filter-options"],
    queryFn: getProductFilterOptions,
    staleTime: Infinity,
  });
