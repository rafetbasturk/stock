CREATE INDEX "idx_deliveries_customer"
ON "deliveries" USING btree ("customer_id");

CREATE INDEX "idx_deliveries_delivery_date"
ON "deliveries" USING btree ("delivery_date");

CREATE INDEX "idx_deliveries_deleted"
ON "deliveries" USING btree ("deleted_at");

CREATE INDEX "idx_deliveries_date_customer"
ON "deliveries" USING btree ("delivery_date","customer_id");


-- Trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- Trigram indexes
CREATE INDEX "idx_deliveries_delivery_number_trgm_active"
ON "deliveries"
USING gin ("delivery_number" gin_trgm_ops)
WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_deliveries_notes_trgm_active"
ON "deliveries"
USING gin ("notes" gin_trgm_ops)
WHERE "deleted_at" IS NULL;
