import { and, eq, lt, sql } from 'drizzle-orm'
import { LOCK_TIME_MS, MAX_ATTEMPTS, SESSION_TTL_SECONDS } from './constants'
import { db } from '@/db'
import { loginAttemptsTable } from '@/db/schema'
import { fail } from '@/lib/error/core/serverError'

export async function checkLoginAllowed(username: string, ip: string | null) {
  if (!ip) return true

  const now = new Date()

  const rows = await db
    .select()
    .from(loginAttemptsTable)
    .where(
      and(
        eq(loginAttemptsTable.username, username),
        eq(loginAttemptsTable.ip, ip),
      ),
    )
    .limit(1)

  const record = rows.at(0)

  if (!record) return true

  if (record.locked_until && record.locked_until > now) {
    fail('ACCOUNT_LOCKED')
  }

  return true
}

export async function recordFailedAttempt(username: string, ip: string | null) {
  if (!ip) return

  const now = new Date()

  await db
    .insert(loginAttemptsTable)
    .values({
      username,
      ip,
      attempts: 1,
      last_attempt_at: now,
      locked_until: null,
    })
    .onConflictDoUpdate({
      target: [loginAttemptsTable.username, loginAttemptsTable.ip],
      set: {
        attempts: sql`${loginAttemptsTable.attempts} + 1`,
        locked_until: sql`
          CASE
            WHEN ${loginAttemptsTable.attempts} + 1 >= ${MAX_ATTEMPTS}
            THEN ${new Date(now.getTime() + LOCK_TIME_MS)}
            ELSE ${loginAttemptsTable.locked_until}
          END
        `,
        last_attempt_at: now,
      },
    })
}

export async function clearLoginAttempts(username: string, ip: string | null) {
  if (!ip) return

  await db
    .delete(loginAttemptsTable)
    .where(
      and(
        eq(loginAttemptsTable.username, username),
        eq(loginAttemptsTable.ip, ip),
      ),
    )
}

export async function cleanupLoginAttempts() {
  if (Math.random() > 0.01) return

  await db
    .delete(loginAttemptsTable)
    .where(
      lt(
        loginAttemptsTable.last_attempt_at,
        new Date(Date.now() - SESSION_TTL_SECONDS),
      ),
    )
}
