// src/server/customers.ts
import { db } from '@/db'
import { createServerFn } from '@tanstack/react-start'


export const getCustomers = createServerFn().handler(async () => {
  return await db.query.customersTable.findMany()
})