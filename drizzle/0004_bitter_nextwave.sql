CREATE INDEX "idx_delivery_items_delivery_id"
ON "delivery_items" USING btree ("delivery_id");

CREATE INDEX "idx_delivery_items_order_item_id"
ON "delivery_items" USING btree ("order_item_id");

CREATE INDEX "idx_delivery_items_custom_order_item_id"
ON "delivery_items" USING btree ("custom_order_item_id");

CREATE INDEX "idx_delivery_items_order_item_delivery"
ON "delivery_items" USING btree ("order_item_id","delivery_id");

CREATE INDEX "idx_delivery_items_custom_order_item_delivery"
ON "delivery_items" USING btree ("custom_order_item_id","delivery_id");

CREATE INDEX "idx_delivery_items_created_at"
ON "delivery_items" USING btree ("created_at");

-- Optional additional optimization
CREATE INDEX "idx_delivery_items_delivery_order_item"
ON "delivery_items" USING btree ("delivery_id","order_item_id");
