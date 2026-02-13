-- Enable trigram extension (required for fast ILIKE '%text%' search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Keep btree indexes for exact match / sorting / joins
CREATE INDEX "idx_products_customer"
ON "products" USING btree ("customer_id");

CREATE INDEX "idx_products_deleted"
ON "products" USING btree ("deleted_at");


-- Trigram indexes for fast text search
CREATE INDEX "idx_products_code_trgm"
ON "products" USING gin ("code" gin_trgm_ops);

CREATE INDEX "idx_products_name_trgm"
ON "products" USING gin ("name" gin_trgm_ops);

CREATE INDEX "idx_products_material_trgm"
ON "products" USING gin ("material" gin_trgm_ops);

CREATE INDEX "idx_products_other_codes_trgm"
ON "products" USING gin ("other_codes" gin_trgm_ops);

CREATE INDEX "idx_products_coating_trgm"
ON "products" USING gin ("coating" gin_trgm_ops);

CREATE INDEX "idx_products_notes_trgm"
ON "products" USING gin ("notes" gin_trgm_ops);

CREATE INDEX "idx_products_post_process_trgm"
ON "products" USING gin ("post_process" gin_trgm_ops);
