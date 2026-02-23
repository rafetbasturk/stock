-- Existing timestamp values are stored as Europe/Istanbul local wall time.
-- Convert to timestamptz using that source zone to preserve true instants.
ALTER TABLE "customers"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "deleted_at" TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "products"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "deleted_at" TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "orders"
  ALTER COLUMN "order_date" TYPE timestamp with time zone USING "order_date" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "deleted_at" TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "order_items"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "deleted_at" TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "custom_order_items"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "deleted_at" TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "deliveries"
  ALTER COLUMN "delivery_date" TYPE timestamp with time zone USING "delivery_date" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "deleted_at" TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "delivery_items"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "deleted_at" TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "users"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "sessions"
  ALTER COLUMN "expires_at" TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "last_activity_at" TYPE timestamp with time zone USING "last_activity_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "login_attempts"
  ALTER COLUMN "locked_until" TYPE timestamp with time zone USING "locked_until" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "last_attempt_at" TYPE timestamp with time zone USING "last_attempt_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "rate_limits"
  ALTER COLUMN "window_start" TYPE timestamp with time zone USING "window_start" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "locked_until" TYPE timestamp with time zone USING "locked_until" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul';

ALTER TABLE "stock_movements"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Istanbul',
  ALTER COLUMN "deleted_at" TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'Europe/Istanbul';
