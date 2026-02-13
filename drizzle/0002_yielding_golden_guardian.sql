CREATE INDEX "idx_order_items_product_id"
ON "order_items" USING btree ("product_id");

CREATE INDEX "idx_order_items_created_at"
ON "order_items" USING btree ("created_at");

CREATE INDEX "idx_order_items_order_created"
ON "order_items" USING btree ("order_id","created_at");

CREATE INDEX "idx_order_items_order_product"
ON "order_items" USING btree ("order_id","product_id");
