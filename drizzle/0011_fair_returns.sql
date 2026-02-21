DO $$
BEGIN
  CREATE TYPE "public"."delivery_kind" AS ENUM('DELIVERY', 'RETURN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "kind" "delivery_kind";
UPDATE "deliveries" SET "kind" = 'DELIVERY' WHERE "kind" IS NULL;
ALTER TABLE "deliveries" ALTER COLUMN "kind" SET DEFAULT 'DELIVERY';
ALTER TABLE "deliveries" ALTER COLUMN "kind" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_deliveries_kind" ON "deliveries" USING btree ("kind");
