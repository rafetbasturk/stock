import { sql } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'

export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: async () => {
        const rawDatabaseUrl = process.env.DATABASE_URL
        const hasDatabaseUrl = Boolean(rawDatabaseUrl)
        let databaseUrlInfo: {
          protocol: string | null
          host: string | null
          port: string | null
          database: string | null
          sslmode: string | null
          isParsed: boolean
        } = {
          protocol: null,
          host: null,
          port: null,
          database: null,
          sslmode: null,
          isParsed: false,
        }

        if (rawDatabaseUrl) {
          try {
            const parsed = new URL(rawDatabaseUrl)
            databaseUrlInfo = {
              protocol: parsed.protocol.replace(':', ''),
              host: parsed.hostname,
              port: parsed.port || null,
              database: parsed.pathname.replace(/^\//, '') || null,
              sslmode: parsed.searchParams.get('sslmode'),
              isParsed: true,
            }
          } catch {
            databaseUrlInfo = {
              ...databaseUrlInfo,
              isParsed: false,
            }
          }
        }

        try {
          await db.execute(sql`select 1`)

          return new Response(
            JSON.stringify({
              status: 'ok',
              database: 'ok',
              hasDatabaseUrl,
              databaseUrlInfo,
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
              databaseUrlInfo,
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
