import { db } from '@/db'
import { sessionsTable, usersTable } from '@/db/schema'
import { eq, gt, and, or, lt } from 'drizzle-orm'
import { fail } from '@/lib/error/core/serverError'
import {
  getSessionCookie,
  setSessionCookie,
  clearSessionCookie,
} from './cookies'
import { getUserAgent } from './clientInfo'
import { SESSION_TTL_SECONDS, INACTIVITY_LIMIT_MS } from './constants'
import { cleanupRateLimits } from './rateLimit'
import { cleanupLoginAttempts } from './loginAttempts'

export async function deleteExpiredSessions() {
  const now = new Date()

  await db
    .delete(sessionsTable)
    .where(
      or(
        lt(sessionsTable.expires_at, now),
        lt(
          sessionsTable.last_activity_at,
          new Date(now.getTime() - INACTIVITY_LIMIT_MS),
        ),
      ),
    )
}

export async function createSession(userId: number) {
  const token = crypto.randomUUID()
  const now = new Date()

  await cleanupRateLimits()
  await cleanupLoginAttempts()
  await deleteExpiredSessions()

  await db.insert(sessionsTable).values({
    user_id: userId,
    refresh_token: token,
    user_agent: getUserAgent(),
    expires_at: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
    last_activity_at: now,
  })

  setSessionCookie(token)
}

export async function destroySession() {
  const token = getSessionCookie()

  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.refresh_token, token))
  }

  clearSessionCookie()
}

export async function getUserFromSession() {
  const token = getSessionCookie()

  if (!token) return null

  const now = new Date()

  const rows = await db
    .select({
      sessionId: sessionsTable.id,
      id: usersTable.id,
      username: usersTable.username,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.user_id))
    .where(
      and(
        eq(sessionsTable.refresh_token, token),
        gt(sessionsTable.expires_at, now),
        gt(
          sessionsTable.last_activity_at,
          new Date(now.getTime() - INACTIVITY_LIMIT_MS),
        ),
      ),
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    await destroySession()
    fail('SESSION_INVALID')
  }

  await db
    .update(sessionsTable)
    .set({ last_activity_at: now })
    .where(eq(sessionsTable.id, row.sessionId))

  return { id: row.id, username: row.username }
}
