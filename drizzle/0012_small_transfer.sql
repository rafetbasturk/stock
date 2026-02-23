DO $$
BEGIN
  ALTER TYPE "public"."stock_movement_type" ADD VALUE IF NOT EXISTS 'TRANSFER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "public"."stock_reference_type" ADD VALUE IF NOT EXISTS 'transfer';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
