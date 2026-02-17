ALTER TABLE "customers" DROP CONSTRAINT "customers_code_unique";--> statement-breakpoint
ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_customer_id_delivery_number_unique";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_order_number_customer_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customers_code_unique" ON "customers" USING btree ("code") WHERE "customers"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deliveries_number_customer_unique" ON "deliveries" USING btree ("customer_id","delivery_number") WHERE "deliveries"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_orders_number_customer_unique" ON "orders" USING btree ("order_number","customer_id") WHERE "orders"."deleted_at" is null;