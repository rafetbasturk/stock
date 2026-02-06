import { statusArray, unitArray } from '@/lib/constants'
import { currencyArray } from '@/lib/currency'
import { relations } from 'drizzle-orm'
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  unique,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core'

// Define enums for Postgres
export const statusEnum = pgEnum(
  'status',
  statusArray as unknown as [string, ...string[]],
)
export const unitEnum = pgEnum(
  'unit',
  unitArray as unknown as [string, ...string[]],
)
export const currencyEnum = pgEnum(
  'currency',
  currencyArray as unknown as [string, ...string[]],
)

const timestamps = {
  created_at: timestamp('created_at').defaultNow().notNull(),

  updated_at: timestamp('updated_at').defaultNow().notNull(),

  deleted_at: timestamp('deleted_at'),
}

export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  ...timestamps,
})

export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  unit: unitEnum('unit').notNull().default('adet'),
  price: integer('price').default(0),
  currency: currencyEnum('currency').default('TRY'),
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
})

export const ordersTable = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    is_custom_order: boolean('is_custom_order').default(false),
    order_number: text('order_number').notNull(),
    order_date: timestamp('order_date').defaultNow().notNull(),
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
    unique().on(table.order_number, table.customer_id),
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
    currency: currencyEnum('currency').default('TRY'),
    ...timestamps,
  },
  (table) => [index('idx_order_items_order_id').on(table.order_id)],
)

export const customOrderItemsTable = pgTable('custom_order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  unit: unitEnum('unit').default('adet'),
  quantity: integer('quantity').notNull().default(1),
  unit_price: integer('unit_price').notNull(),
  currency: currencyEnum('currency').default('TRY'),
  notes: text('notes'),
  ...timestamps,
})

export const deliveriesTable = pgTable(
  'deliveries',
  {
    id: serial('id').primaryKey(),
    customer_id: integer('customer_id')
      .notNull()
      .references(() => customersTable.id, { onDelete: 'restrict' }),
    delivery_number: text('delivery_number').notNull(),
    delivery_date: timestamp('delivery_date').defaultNow().notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [unique().on(table.customer_id, table.delivery_number)],
)

export const deliveryItemsTable = pgTable('delivery_items', {
  id: serial('id').primaryKey(),
  delivery_id: integer('delivery_id')
    .notNull()
    .references(() => deliveriesTable.id, { onDelete: 'cascade' }),

  order_item_id: integer('order_item_id').references(() => orderItemsTable.id, {
    onDelete: 'cascade',
  }),
  custom_order_item_id: integer('custom_order_item_id').references(
    () => customOrderItemsTable.id,
    { onDelete: 'cascade' },
  ),

  delivered_quantity: integer('delivered_quantity').notNull(),
  ...timestamps,
})

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
  orderItems: many(orderItemsTable), // product can appear in many order items
}))

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  role: text('role').default('user'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const sessionsTable = pgTable('sessions', {
  id: serial('id').primaryKey(),

  user_id: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),

  // Secure random refresh token (UUIDv4)
  refresh_token: text('refresh_token').notNull().unique(),

  // Optional user-agent string for session tracking
  user_agent: text('user_agent'),

  // Expiration timestamp
  expires_at: timestamp('expires_at').notNull(),

  last_activity_at: timestamp('last_activity_at').notNull(),

  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.user_id],
    references: [usersTable.id],
  }),
}))
