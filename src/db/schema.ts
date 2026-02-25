import { isNull, relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import {
  currencyEnum,
  deliveryKindEnum,
  statusEnum,
  stockMovementTypeEnum,
  stockReferenceTypeEnum,
  unitEnum,
} from './enums'

const timestamps = {
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}

export const customersTable = pgTable(
  'customers',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    address: text('address'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_customers_code_unique')
      .on(table.code)
      .where(isNull(table.deleted_at)),
  ],
)

export const productsTable = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    unit: unitEnum('unit').notNull().default('adet'),
    price: integer('price').default(0),
    currency: currencyEnum('currency').notNull().default('TRY'),
    stock_quantity: integer('stock_quantity').notNull().default(0),
    min_stock_level: integer('min_stock_level').notNull().default(0),
    other_codes: text('other_codes'),
    material: text('material'),
    post_process: text('post_process'),
    coating: text('coating'),
    specs: text('specs'),
    specs_net: text('specs_net'),
    notes: text('notes'),
    customer_id: integer('customer_id')
      .notNull()
      .references(() => customersTable.id, {
        onDelete: 'restrict',
      }),
    ...timestamps,
  },
  (table) => [
    index('idx_products_code').on(table.code),
    index('idx_products_name').on(table.name),
    index('idx_products_material').on(table.material),
    index('idx_products_customer').on(table.customer_id),
    index('idx_products_deleted').on(table.deleted_at),
    index('idx_products_other_codes').on(table.other_codes),
    index('idx_products_notes').on(table.notes),
    index('idx_products_coating').on(table.coating),
    index('idx_products_post_process').on(table.post_process),

    check(
      'products_stock_quantity_not_negative',
      sql`${table.stock_quantity} >= 0`,
    ),
    check(
      'products_min_stock_not_negative',
      sql`${table.min_stock_level} >= 0`,
    ),
    check('products_price_not_negative', sql`${table.price} >= 0`),
  ],
)

export const ordersTable = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    is_custom_order: boolean('is_custom_order').default(false),
    order_number: text('order_number').notNull(),
    order_date: timestamp('order_date', { withTimezone: true })
      .defaultNow()
      .notNull(),
    delivery_address: text('delivery_address'),
    customer_id: integer('customer_id')
      .notNull()
      .references(() => customersTable.id),
    status: statusEnum('status').default('KAYIT').notNull(),
    currency: currencyEnum('currency').default('TRY'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_orders_number_customer_unique')
      .on(table.order_number, table.customer_id)
      .where(isNull(table.deleted_at)),
    index('idx_orders_order_number').on(table.order_number),
    index('idx_orders_order_date').on(table.order_date),
    index('idx_orders_customer').on(table.customer_id),
    index('idx_orders_status').on(table.status),
    index('idx_orders_deleted').on(table.deleted_at),
    index('idx_orders_currency').on(table.currency),
  ],
)

export const orderItemsTable = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    order_id: integer('order_id')
      .notNull()
      .references(() => ordersTable.id, { onDelete: 'cascade' }),
    product_id: integer('product_id')
      .notNull()
      .references(() => productsTable.id),
    quantity: integer('quantity').notNull().default(1),
    unit_price: integer('unit_price').notNull(),
    currency: currencyEnum('currency').notNull().default('TRY'),
    ...timestamps,
  },
  (table) => [
    index('idx_order_items_order_id').on(table.order_id),
    index('idx_order_items_product_id').on(table.product_id),
    index('idx_order_items_created_at').on(table.created_at),
    index('idx_order_items_order_created').on(table.order_id, table.created_at),

    check('order_items_quantity_positive', sql`${table.quantity} > 0`),
    check('order_items_unit_price_not_negative', sql`${table.unit_price} >= 0`),
  ],
)

export const customOrderItemsTable = pgTable(
  'custom_order_items',
  {
    id: serial('id').primaryKey(),
    order_id: integer('order_id')
      .notNull()
      .references(() => ordersTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    unit: unitEnum('unit').notNull().default('adet'),
    quantity: integer('quantity').notNull().default(1),
    unit_price: integer('unit_price').notNull(),
    currency: currencyEnum('currency').notNull().default('TRY'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    index('idx_custom_order_items_order_id').on(table.order_id),
    index('idx_custom_order_items_created_at').on(table.created_at),
    index('idx_custom_order_items_order_created').on(
      table.order_id,
      table.created_at,
    ),

    check('custom_order_items_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'custom_order_items_unit_price_not_negative',
      sql`${table.unit_price} >= 0`,
    ),
  ],
)

export const deliveriesTable = pgTable(
  'deliveries',
  {
    id: serial('id').primaryKey(),
    customer_id: integer('customer_id')
      .notNull()
      .references(() => customersTable.id, { onDelete: 'restrict' }),
    kind: deliveryKindEnum('kind').notNull().default('DELIVERY'),
    delivery_number: text('delivery_number').notNull(),
    delivery_date: timestamp('delivery_date', { withTimezone: true })
      .defaultNow()
      .notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_deliveries_number_customer_unique')
      .on(table.customer_id, table.delivery_number)
      .where(isNull(table.deleted_at)),
    index('idx_deliveries_customer').on(table.customer_id),
    index('idx_deliveries_kind').on(table.kind),
    index('idx_deliveries_delivery_date').on(table.delivery_date),
    index('idx_deliveries_deleted').on(table.deleted_at),
    index('idx_deliveries_date_customer').on(
      table.delivery_date,
      table.customer_id,
    ),
  ],
)

export const deliveryItemsTable = pgTable(
  'delivery_items',
  {
    id: serial('id').primaryKey(),
    delivery_id: integer('delivery_id')
      .notNull()
      .references(() => deliveriesTable.id, { onDelete: 'cascade' }),
    order_item_id: integer('order_item_id').references(
      () => orderItemsTable.id,
      {
        onDelete: 'cascade',
      },
    ),
    custom_order_item_id: integer('custom_order_item_id').references(
      () => customOrderItemsTable.id,
      {
        onDelete: 'cascade',
      },
    ),
    delivered_quantity: integer('delivered_quantity').notNull(),
    ...timestamps,
  },
  (table) => [
    index('idx_delivery_items_delivery_id').on(table.delivery_id),
    index('idx_delivery_items_order_item_id').on(table.order_item_id),
    index('idx_delivery_items_custom_order_item_id').on(
      table.custom_order_item_id,
    ),
    index('idx_delivery_items_order_item_delivery').on(
      table.order_item_id,
      table.delivery_id,
    ),
    index('idx_delivery_items_custom_order_item_delivery').on(
      table.custom_order_item_id,
      table.delivery_id,
    ),
    index('idx_delivery_items_created_at').on(table.created_at),
    check(
      'delivery_items_exactly_one_reference',
      sql`
    (${table.order_item_id} IS NOT NULL AND ${table.custom_order_item_id} IS NULL)
    OR
    (${table.order_item_id} IS NULL AND ${table.custom_order_item_id} IS NOT NULL)
  `,
    ),

    check(
      'delivery_items_quantity_positive',
      sql`${table.delivered_quantity} > 0`,
    ),
  ],
)

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [ordersTable.customer_id],
    references: [customersTable.id],
  }),
  items: many(orderItemsTable),
  customItems: many(customOrderItemsTable),
}))

export const orderItemsRelations = relations(
  orderItemsTable,
  ({ one, many }) => ({
    order: one(ordersTable, {
      fields: [orderItemsTable.order_id],
      references: [ordersTable.id],
    }),
    product: one(productsTable, {
      fields: [orderItemsTable.product_id],
      references: [productsTable.id],
    }),
    deliveries: many(deliveryItemsTable),
  }),
)

export const customOrderItemsRelations = relations(
  customOrderItemsTable,
  ({ one, many }) => ({
    order: one(ordersTable, {
      fields: [customOrderItemsTable.order_id],
      references: [ordersTable.id],
    }),
    deliveries: many(deliveryItemsTable),
  }),
)

export const deliveriesRelations = relations(
  deliveriesTable,
  ({ one, many }) => ({
    customer: one(customersTable, {
      fields: [deliveriesTable.customer_id],
      references: [customersTable.id],
    }),
    items: many(deliveryItemsTable),
  }),
)

export const deliveryItemsRelations = relations(
  deliveryItemsTable,
  ({ one }) => ({
    delivery: one(deliveriesTable, {
      fields: [deliveryItemsTable.delivery_id],
      references: [deliveriesTable.id],
    }),
    orderItem: one(orderItemsTable, {
      fields: [deliveryItemsTable.order_item_id],
      references: [orderItemsTable.id],
    }),
    customOrderItem: one(customOrderItemsTable, {
      fields: [deliveryItemsTable.custom_order_item_id],
      references: [customOrderItemsTable.id],
    }),
  }),
)

export const customersRelations = relations(customersTable, ({ many }) => ({
  orders: many(ordersTable), // one customer has many orders
  products: many(productsTable), // one customer can have many products
}))

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [productsTable.customer_id],
    references: [customersTable.id],
  }),
  orderItems: many(orderItemsTable),
  stockMovements: many(stockMovementsTable),
}))

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  role: text('role').default('user'),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const sessionsTable = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    user_id: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    refresh_token: text('refresh_token').notNull().unique(),
    user_agent: text('user_agent'),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    last_activity_at: timestamp('last_activity_at', {
      withTimezone: true,
    }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('sessions_user_idx').on(table.user_id),
    index('sessions_expires_idx').on(table.expires_at),
    index('sessions_last_activity_idx').on(table.last_activity_at),
    uniqueIndex('sessions_refresh_token_idx').on(table.refresh_token),
  ],
)

export const loginAttemptsTable = pgTable(
  'login_attempts',
  {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    ip: text('ip').notNull(),
    attempts: integer('attempts').notNull().default(0),
    locked_until: timestamp('locked_until', { withTimezone: true }),
    last_attempt_at: timestamp('last_attempt_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('login_attempts_username_ip_idx').on(table.username, table.ip),
  ],
)

export const rateLimitsTable = pgTable('rate_limits', {
  id: serial('id').primaryKey(),
  ip: text('ip').notNull().unique(),
  count: integer('count').notNull().default(0),
  window_start: timestamp('window_start', { withTimezone: true }).notNull(),
  locked_until: timestamp('locked_until', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.user_id],
    references: [usersTable.id],
  }),
}))

export const stockMovementsTable = pgTable(
  'stock_movements',
  {
    id: serial('id').primaryKey(),
    product_id: integer('product_id')
      .notNull()
      .references(() => productsTable.id, {
        onDelete: 'restrict',
      }),
    movement_type: stockMovementTypeEnum('movement_type').notNull(),
    quantity: integer('quantity').notNull(),
    reference_type: stockReferenceTypeEnum('reference_type'),
    reference_id: integer('reference_id'),
    notes: text('notes'),
    created_by: integer('created_by')
      .notNull()
      .references(() => usersTable.id),
    ...timestamps,
  },
  (table) => [
    index('idx_stock_movements_product').on(table.product_id),
    index('idx_stock_movements_created').on(table.created_at),
    index('idx_stock_movements_type').on(table.movement_type),
    index('idx_stock_movements_product_created').on(
      table.product_id,
      table.created_at,
    ),
    index('idx_stock_movements_reference').on(
      table.reference_type,
      table.reference_id,
    ),
    index('idx_stock_movements_created_by').on(table.created_by),

    check('stock_movements_quantity_not_zero', sql`${table.quantity} <> 0`),
    check(
      'stock_movements_reference_consistency',
      sql`
    (${table.reference_type} IS NULL AND ${table.reference_id} IS NULL)
    OR
    (${table.reference_type} IS NOT NULL AND ${table.reference_id} IS NOT NULL)
  `,
    ),
  ],
)

export const stockMovementsRelations = relations(
  stockMovementsTable,
  ({ one }) => ({
    product: one(productsTable, {
      fields: [stockMovementsTable.product_id],
      references: [productsTable.id],
    }),
    createdBy: one(usersTable, {
      fields: [stockMovementsTable.created_by],
      references: [usersTable.id],
    }),
  }),
)
