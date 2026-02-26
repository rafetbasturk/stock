import { sql } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'

export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: async () => {
        const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

        try {
          await db.execute(sql`select 1`)

          return new Response(
            JSON.stringify({
              status: 'ok',
              database: 'ok',
              hasDatabaseUrl,
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
        } catch (error: unknown) {
          const errorType =
            error instanceof Error
              ? error.name
              : typeof error === 'string'
                ? 'ErrorString'
                : 'UnknownError'
          const errorCode =
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            typeof (error as { code?: unknown }).code === 'string'
              ? (error as { code: string }).code
              : null

          return new Response(
            JSON.stringify({
              status: 'error',
              database: 'down',
              hasDatabaseUrl,
              errorType,
              errorCode,
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
