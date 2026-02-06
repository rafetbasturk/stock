import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";

export type HomeSearch = {
  customerId?: number;
  year?: number;
};

export const productSortFields = [
  "code",
  "name",
  "price",
  "other_codes",
  "material",
  "post_process",
  "coating",
] as const;

export type ProductSortField = (typeof productSortFields)[number];

export const productsSearchSchema = z.object({
  pageIndex: fallback(z.coerce.number().int().min(0), 0),
  pageSize: fallback(z.coerce.number().int().min(10).max(100), 100),
  sortBy: fallback(z.enum(productSortFields), "code"),
  sortDir: fallback(z.enum(["asc", "desc"]), "asc"),
  q: z
    .preprocess((v) => {
      if (typeof v !== "string") return undefined;
      const t = v.trim();
      return t.length ? t : undefined;
    }, z.string().min(1))
    .optional(),
  material: z
    .preprocess((v) => {
      if (v == null) return undefined;
      if (Array.isArray(v)) return v.join("|");
      if (typeof v === "string") {
        const t = v.trim();
        return t.length ? t : undefined;
      }
      return undefined;
    }, z.string())
    .optional(),
  customer: z
    .preprocess((v) => {
      if (v == null) return undefined;
      if (typeof v === "string") {
        const t = v.trim();
        return t.length ? t : undefined;
      }
      return undefined;
    }, z.string())
    .optional(),
});

export type ProductsSearch = z.infer<typeof productsSearchSchema>;
