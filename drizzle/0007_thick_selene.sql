DO $$ BEGIN
 CREATE TYPE "public"."stock_reference_type" AS ENUM (
   'order',
   'delivery',
   'adjustment',
   'purchase'
 );
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
ALTER TABLE "custom_order_items" ALTER COLUMN "unit" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_order_items" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_movements"
ALTER COLUMN "reference_type"
TYPE "public"."stock_reference_type"
USING "reference_type"::text::"public"."stock_reference_type";--> statement-breakpoint
ALTER TABLE "stock_movements" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_stock_movements_created_by" ON "stock_movements" USING btree ("created_by");--> statement-breakpoint
ALTER TABLE "custom_order_items" ADD CONSTRAINT "custom_order_items_quantity_positive" CHECK ("custom_order_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "custom_order_items" ADD CONSTRAINT "custom_order_items_unit_price_not_negative" CHECK ("custom_order_items"."unit_price" >= 0);--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_exactly_one_reference" CHECK (
    ("delivery_items"."order_item_id" IS NOT NULL AND "delivery_items"."custom_order_item_id" IS NULL)
    OR
    ("delivery_items"."order_item_id" IS NULL AND "delivery_items"."custom_order_item_id" IS NOT NULL)
  );--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_quantity_positive" CHECK ("delivery_items"."delivered_quantity" > 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_not_negative" CHECK ("order_items"."unit_price" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_quantity_not_negative" CHECK ("products"."stock_quantity" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_min_stock_not_negative" CHECK ("products"."min_stock_level" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_not_negative" CHECK ("products"."price" >= 0);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_quantity_not_zero" CHECK ("stock_movements"."quantity" <> 0);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_reference_consistency" CHECK (
    ("stock_movements"."reference_type" IS NULL AND "stock_movements"."reference_id" IS NULL)
    OR
    ("stock_movements"."reference_type" IS NOT NULL AND "stock_movements"."reference_id" IS NOT NULL)
  );