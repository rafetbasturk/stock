// src/server/seed.ts
import { db } from '@/db'
import {
  customersTable,
  productsTable,
  ordersTable,
  orderItemsTable,
} from '@/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from './middleware/auth'
import { faker } from '@faker-js/faker'

export const seedDatabase = createServerFn().middleware([authMiddleware]).handler(
  async () => {

    console.log('--- Seeding Started ---')
    try {
      // 1. Clear existing data
      console.log('Clearing existing data...')
      await db.delete(orderItemsTable)
      await db.delete(ordersTable)
      await db.delete(productsTable)
      await db.delete(customersTable)
      console.log('Data cleared')

      // 2. Seed Customers
      console.log('Seeding customers...')
      const customers = await db
        .insert(customersTable)
        .values([
          { code: 'CUST-001', name: 'Global Trade Co.' },
          { code: 'CUST-002', name: 'Tech Solutions Ltd' },
          { code: 'CUST-003', name: 'Central Logistics' },
        ])
        .returning()
      console.log(`Seeded ${customers.length} customers`)

      // 3. Seed Products
      console.log('Seeding products...')
      const products = await db
        .insert(productsTable)
        .values([
          {
            code: 'PROD-A1',
            name: 'Steel Bearing Large',
            customer_id: customers[0]!.id,
            price: 1500,
            currency: 'TRY',
          },
          {
            code: 'PROD-B2',
            name: 'Aluminum Housing',
            customer_id: customers[1]!.id,
            price: 45,
            currency: 'EUR',
          },
          {
            code: 'PROD-C3',
            name: 'Precision Shaft',
            customer_id: customers[2]!.id,
            price: 120,
            currency: 'USD',
          },
        ])
        .returning()
      console.log(`Seeded ${products.length} products`)

      // 4. Seed Orders & Items for last 3 months
      console.log('Seeding orders...')
      for (let i = 0; i < 20; i++) {
        const customer = faker.helpers.arrayElement(customers)
        const orderDate = faker.date.recent({ days: 90 })
        const status = faker.helpers.arrayElement([
          'KAYIT',
          'ONAY',
          'ÜRETİM',
          'SEVK',
          'BİTTİ',
        ] as const)

        const [order] = await db
          .insert(ordersTable)
          .values({
            order_number: `ORD-${2026}${i.toString().padStart(3, '0')}`,
            customer_id: customer.id,
            order_date: orderDate,
            status: status,
            currency: 'TRY',
          })
          .returning()

        if (order) {
          const product = faker.helpers.arrayElement(products)
          await db.insert(orderItemsTable).values({
            order_id: order.id,
            product_id: product.id,
            quantity: faker.number.int({ min: 1, max: 100 }),
            unit_price: product.price ?? 100,
            currency: product.currency ?? 'TRY',
          })
        }
      }

      return { success: true, message: 'Database seeded successfully' }
    } catch (error) {
      console.error('Seeding failed:', error)
      return { success: false, error: String(error) }
    }
  },
)
