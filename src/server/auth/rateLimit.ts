import { lt, sql } from 'drizzle-orm'
import { GLOBAL_LIMIT, GLOBAL_LOCK_MS, GLOBAL_WINDOW_MS } from './constants'
import { db } from '@/db'
import { rateLimitsTable } from '@/db/schema'
import { fail } from '@/lib/error/core/serverError'

export async function checkGlobalRateLimit(ip: string | null) {
  if (!ip) return

  const now = new Date()

  const result = await db
    .insert(rateLimitsTable)
    .values({
      ip,
      count: 1,
      window_start: now,
    })
    .onConflictDoUpdate({
      target: rateLimitsTable.ip,
      set: {
        count: sql`
          CASE
            WHEN ${rateLimitsTable.window_start} < ${new Date(now.getTime() - GLOBAL_WINDOW_MS)}
            THEN 1
            ELSE ${rateLimitsTable.count} + 1
          END
        `,
        window_start: sql`
          CASE
            WHEN ${rateLimitsTable.window_start} < ${new Date(now.getTime() - GLOBAL_WINDOW_MS)}
            THEN ${now}
            ELSE ${rateLimitsTable.window_start}
          END
        `,
        locked_until: sql`
          CASE
            WHEN ${rateLimitsTable.count} + 1 > ${GLOBAL_LIMIT}
            THEN ${new Date(now.getTime() + GLOBAL_LOCK_MS)}
            ELSE ${rateLimitsTable.locked_until}
          END
        `,
      },
    })
    .returning()

  const record = result[0]

  if (record.locked_until && record.locked_until > now) {
    fail('RATE_LIMIT_EXCEEDED')
  }
}

export async function cleanupRateLimits() {
  if (Math.random() > 0.01) return

  await db
    .delete(rateLimitsTable)
    .where(lt(rateLimitsTable.window_start, new Date(Date.now() - 86400000)))
}
