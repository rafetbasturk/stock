import { sql } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'

export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await db.execute(sql`select 1`)

          return new Response(
            JSON.stringify({
              status: 'ok',
              database: 'ok',
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
              },
            },
          )
        } catch {
          return new Response(
            JSON.stringify({
              status: 'error',
              database: 'down',
              timestamp: new Date().toISOString(),
            }),
            {
              status: 503,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
              },
            },
          )
        }
      },
    },
  },
})
