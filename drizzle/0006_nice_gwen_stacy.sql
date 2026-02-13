-- Ensure enum exists (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type'
  ) THEN
    CREATE TYPE stock_movement_type AS ENUM (
      'IN',
      'OUT',
      'ADJUSTMENT',
      'RESERVE',
      'RELEASE'
    );
  END IF;
END $$;

-- Create table safely
CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" serial PRIMARY KEY NOT NULL,

  "product_id" integer NOT NULL,

  "movement_type" stock_movement_type NOT NULL,

  "quantity" integer NOT NULL,

  "reference_type" text,

  "reference_id" integer,

  "notes" text,

  "created_by" integer,

  "created_at" timestamp DEFAULT now() NOT NULL,

  "updated_at" timestamp DEFAULT now() NOT NULL,

  "deleted_at" timestamp
);

-- Add foreign key: product_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stock_movements_product_id_products_id_fk'
  ) THEN
    ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_product_id_products_id_fk"
    FOREIGN KEY ("product_id")
    REFERENCES "public"."products"("id")
    ON DELETE RESTRICT;
  END IF;
END $$;

-- Add foreign key: created_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stock_movements_created_by_users_id_fk'
  ) THEN
    ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_created_by_users_id_fk"
    FOREIGN KEY ("created_by")
    REFERENCES "public"."users"("id");
  END IF;
END $$;

-- Indexes (already correct)
CREATE INDEX IF NOT EXISTS "idx_stock_movements_product"
ON "stock_movements" USING btree ("product_id");

CREATE INDEX IF NOT EXISTS "idx_stock_movements_created"
ON "stock_movements" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "idx_stock_movements_type"
ON "stock_movements" USING btree ("movement_type");

CREATE INDEX IF NOT EXISTS "idx_stock_movements_product_created"
ON "stock_movements" USING btree ("product_id","created_at");

CREATE INDEX IF NOT EXISTS "idx_stock_movements_reference"
ON "stock_movements" USING btree ("reference_type","reference_id");
