CREATE INDEX "idx_custom_order_items_order_id"
ON "custom_order_items" USING btree ("order_id");

CREATE INDEX "idx_custom_order_items_created_at"
ON "custom_order_items" USING btree ("created_at");

CREATE INDEX "idx_custom_order_items_order_created"
ON "custom_order_items" USING btree ("order_id","created_at");

-- Optional but recommended
CREATE INDEX "idx_custom_order_items_order_id_id"
ON "custom_order_items" USING btree ("order_id","id");
