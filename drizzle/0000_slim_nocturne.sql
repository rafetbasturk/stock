DO $$ BEGIN
  CREATE TYPE "stock_movement_type" AS ENUM ('IN','OUT','TRANSFER','ADJUSTMENT','RESERVE','RELEASE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "stock_reference_type" AS ENUM ('order','delivery','adjustment','purchase','transfer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "delivery_kind" AS ENUM ('DELIVERY','RETURN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "status" AS ENUM ('KAYIT','ÜRETİM','KISMEN HAZIR','HAZIR','BİTTİ','İPTAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "unit" AS ENUM ('adet','saat','kg','metre');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "currency" AS ENUM ('TRY','EUR','USD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "custom_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit" "unit" DEFAULT 'adet' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "custom_order_items_quantity_positive" CHECK ("custom_order_items"."quantity" > 0),
	CONSTRAINT "custom_order_items_unit_price_not_negative" CHECK ("custom_order_items"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"kind" "delivery_kind" DEFAULT 'DELIVERY' NOT NULL,
	"delivery_number" text NOT NULL,
	"delivery_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "delivery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"delivery_id" integer NOT NULL,
	"order_item_id" integer,
	"custom_order_item_id" integer,
	"delivered_quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "delivery_items_exactly_one_reference" CHECK (
    ("delivery_items"."order_item_id" IS NOT NULL AND "delivery_items"."custom_order_item_id" IS NULL)
    OR
    ("delivery_items"."order_item_id" IS NULL AND "delivery_items"."custom_order_item_id" IS NOT NULL)
  ),
	CONSTRAINT "delivery_items_quantity_positive" CHECK ("delivery_items"."delivered_quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"ip" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_unit_price_not_negative" CHECK ("order_items"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_custom_order" boolean DEFAULT false,
	"order_number" text NOT NULL,
	"order_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delivery_address" text,
	"customer_id" integer NOT NULL,
	"status" "status" DEFAULT 'KAYIT' NOT NULL,
	"currency" "currency" DEFAULT 'TRY',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"unit" "unit" DEFAULT 'adet' NOT NULL,
	"price" integer DEFAULT 0,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"min_stock_level" integer DEFAULT 0 NOT NULL,
	"other_codes" text,
	"material" text,
	"post_process" text,
	"coating" text,
	"specs" text,
	"specs_net" text,
	"notes" text,
	"customer_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_stock_quantity_not_negative" CHECK ("products"."stock_quantity" >= 0),
	CONSTRAINT "products_min_stock_not_negative" CHECK ("products"."min_stock_level" >= 0),
	CONSTRAINT "products_price_not_negative" CHECK ("products"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_ip_unique" UNIQUE("ip")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"refresh_token" text NOT NULL,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"last_activity_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"movement_type" "stock_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"reference_type" "stock_reference_type",
	"reference_id" integer,
	"notes" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "stock_movements_quantity_not_zero" CHECK ("stock_movements"."quantity" <> 0),
	CONSTRAINT "stock_movements_reference_consistency" CHECK (
    ("stock_movements"."reference_type" IS NULL AND "stock_movements"."reference_id" IS NULL)
    OR
    ("stock_movements"."reference_type" IS NOT NULL AND "stock_movements"."reference_id" IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "custom_order_items" ADD CONSTRAINT "custom_order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_custom_order_item_id_custom_order_items_id_fk" FOREIGN KEY ("custom_order_item_id") REFERENCES "public"."custom_order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_custom_order_items_order_id" ON "custom_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_custom_order_items_created_at" ON "custom_order_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_custom_order_items_order_created" ON "custom_order_items" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customers_code_unique" ON "customers" USING btree ("code") WHERE "customers"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deliveries_number_customer_unique" ON "deliveries" USING btree ("customer_id","delivery_number") WHERE "deliveries"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_deliveries_customer" ON "deliveries" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_deliveries_kind" ON "deliveries" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "idx_deliveries_delivery_date" ON "deliveries" USING btree ("delivery_date");--> statement-breakpoint
CREATE INDEX "idx_deliveries_deleted" ON "deliveries" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_deliveries_date_customer" ON "deliveries" USING btree ("delivery_date","customer_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_items_delivery_id" ON "delivery_items" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_items_order_item_id" ON "delivery_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_items_custom_order_item_id" ON "delivery_items" USING btree ("custom_order_item_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_items_order_item_delivery" ON "delivery_items" USING btree ("order_item_id","delivery_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_items_custom_order_item_delivery" ON "delivery_items" USING btree ("custom_order_item_id","delivery_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_items_created_at" ON "delivery_items" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "login_attempts_username_ip_idx" ON "login_attempts" USING btree ("username","ip");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product_id" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_created_at" ON "order_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_created" ON "order_items" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_orders_number_customer_unique" ON "orders" USING btree ("order_number","customer_id") WHERE "orders"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_orders_order_number" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "idx_orders_order_date" ON "orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_deleted" ON "orders" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orders_currency" ON "orders" USING btree ("currency");--> statement-breakpoint
CREATE INDEX "idx_products_code" ON "products" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_products_name" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_products_material" ON "products" USING btree ("material");--> statement-breakpoint
CREATE INDEX "idx_products_customer" ON "products" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_products_deleted" ON "products" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_products_other_codes" ON "products" USING btree ("other_codes");--> statement-breakpoint
CREATE INDEX "idx_products_notes" ON "products" USING btree ("notes");--> statement-breakpoint
CREATE INDEX "idx_products_coating" ON "products" USING btree ("coating");--> statement-breakpoint
CREATE INDEX "idx_products_post_process" ON "products" USING btree ("post_process");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_last_activity_idx" ON "sessions" USING btree ("last_activity_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_refresh_token_idx" ON "sessions" USING btree ("refresh_token");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_product" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_created" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_type" ON "stock_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_product_created" ON "stock_movements" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_reference" ON "stock_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_created_by" ON "stock_movements" USING btree ("created_by");