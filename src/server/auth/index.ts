import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { db } from '@/db'
import { usersTable } from '@/db/schema'
import { fail, throwTransportError } from '@/lib/error/core/serverError'

import { checkGlobalRateLimit } from './rateLimit'
import { getClientIP } from './clientInfo'
import {
  checkLoginAllowed,
  clearLoginAttempts,
  recordFailedAttempt,
} from './loginAttempts'
import { createSession, destroySession, getUserFromSession } from './session'

export const LoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

// const RegisterSchema = z.object({
//   username: z.string().min(3),
//   password: z.string().min(6),
// })

export const authMe = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const user = await getUserFromSession()
    return user ? { id: user.id, username: user.username } : null
  } catch (err) {
    throwTransportError(err)
  }
})

export const authLogin = createServerFn({
  method: 'POST',
})
  .inputValidator((input: unknown) => LoginSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { username, password } = data

      const ip = getClientIP()

      await checkGlobalRateLimit(ip)

      await checkLoginAllowed(username, ip)

      const rows = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          password_hash: usersTable.password_hash,
        })
        .from(usersTable)
        .where(eq(usersTable.username, username))
        .limit(1)

      const user = rows[0]

      if (!user) {
        await recordFailedAttempt(username, ip)
        fail('INVALID_CREDENTIALS')
      }

      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) {
        await recordFailedAttempt(username, ip)
        fail('INVALID_CREDENTIALS')
      }

      await clearLoginAttempts(username, ip)

      await createSession(user.id)

      return { id: user.id, username: user.username }
    } catch (err) {
      throwTransportError(err)
    }
  })

// export const authRegister = createServerFn({ method: 'POST' })
//   .inputValidator((input: unknown) => RegisterSchema.parse(input))
//   .handler(async ({ data }) => {
//     const existing = await db
//       .select({ id: usersTable.id })
//       .from(usersTable)
//       .where(eq(usersTable.username, data.username))
//       .limit(1)

//     if (existing[0]) throw errorCode('USERNAME_EXISTS')

//     const password_hash = await bcrypt.hash(data.password, 12)

//     await db.insert(usersTable).values({
//       username: data.username,
//       password_hash,
//     })

//     const created = await db
//       .select({ id: usersTable.id, username: usersTable.username })
//       .from(usersTable)
//       .where(eq(usersTable.username, data.username))
//       .limit(1)

//     const user = created[0]
//     if (!user) throw errorCode('USER_NOT_FOUND')

//     await createSession(user.id)
//     return { id: user.id, username: user.username }
//   })

export const authLogout = createServerFn({ method: 'POST' }).handler(
  async () => {
    await destroySession()
    return { ok: true }
  },
)
