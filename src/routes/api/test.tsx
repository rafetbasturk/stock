// src/routes/api/test
import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'
import { productsTable } from '@/db/schema'

export const Route = createFileRoute('/api/test')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const data = await db.select().from(productsTable)
        console.log(data)

        return new Response('Hello, World! from ' + request.url)
      },
    },
  },
})
