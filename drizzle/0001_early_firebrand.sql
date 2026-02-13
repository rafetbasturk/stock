-- Required for trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Existing BTree indexes (keep these)
CREATE INDEX "idx_orders_order_number"
ON "orders" USING btree ("order_number");

CREATE INDEX "idx_orders_order_date"
ON "orders" USING btree ("order_date");

CREATE INDEX "idx_orders_customer"
ON "orders" USING btree ("customer_id");

CREATE INDEX "idx_orders_status"
ON "orders" USING btree ("status");

CREATE INDEX "idx_orders_deleted"
ON "orders" USING btree ("deleted_at");

CREATE INDEX "idx_orders_currency"
ON "orders" USING btree ("currency");


-- Composite index for fast pagination and filtering
-- Optimizes ORDER BY order_date DESC with customer filter
CREATE INDEX "idx_orders_date_customer"
ON "orders" USING btree ("order_date" DESC, "customer_id");


-- Trigram indexes for fast search (ILIKE and similarity)
CREATE INDEX "idx_orders_notes_trgm"
ON "orders" USING gin ("notes" gin_trgm_ops);


-- Partial trigram index optimized for soft-delete
-- This is the most efficient index for your actual queries
CREATE INDEX "idx_orders_order_number_trgm_active"
ON "orders" USING gin ("order_number" gin_trgm_ops)
WHERE "deleted_at" IS NULL;
