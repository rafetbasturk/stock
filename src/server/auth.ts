// src/server/auth.ts
import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/db";
import { sessionsTable, usersTable } from "@/db/schema";
import { fail, throwTransportError } from "@/lib/error/core/serverError";
import { errorCode } from "@/lib/error/core/errorCodeMarker";

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

async function getUserFromCookie() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const now = new Date();
  const inactiveBefore = new Date(now.getTime() - INACTIVITY_LIMIT_MS);

  const rows = await db
    .select({
      sessionId: sessionsTable.id,
      lastActivity: sessionsTable.last_activity_at,
      id: usersTable.id,
      username: usersTable.username,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.user_id))
    .where(
      and(
        eq(sessionsTable.refresh_token, token),
        gt(sessionsTable.expires_at, now),
        gt(sessionsTable.last_activity_at, inactiveBefore)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    await destroySession();
    fail("SESSION_INVALID");
  }

  // 🔄 Sliding activity update
  await db
    .update(sessionsTable)
    .set({ last_activity_at: now })
    .where(eq(sessionsTable.id, row.sessionId));

  return { id: row.id, username: row.username };
}

async function createSession(userId: number) {
  const refreshToken = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  await db.insert(sessionsTable).values({
    user_id: userId,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    last_activity_at: now,
  });

  setCookie(SESSION_COOKIE, refreshToken, cookieOptions());
}

async function destroySession() {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    await db
      .delete(sessionsTable)
      .where(eq(sessionsTable.refresh_token, token));
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export const LoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const authMe = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const user = await getUserFromCookie();
    return user ? { id: user.id, username: user.username } : null;
  } catch (err) {
    throwTransportError(err);
  }
});

export const authLogin = createServerFn({
  method: "POST",
})
  .inputValidator((input): z.infer<typeof LoginSchema> => input as any)
  .handler(async ({ data }) => {
    try {
      const { username, password } = LoginSchema.parse(data);

      const rows = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          password_hash: usersTable.password_hash,
        })
        .from(usersTable)
        .where(eq(usersTable.username, username))
        .limit(1);

      const user = rows[0];

      if (!user) fail("USER_NOT_FOUND");

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) fail("INVALID_CREDENTIALS");

      await createSession(user.id);
      return { id: user.id, username: user.username };
    } catch (err) {
      throwTransportError(err);
    }
  });

export const authRegister = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RegisterSchema.parse(input))
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, data.username))
      .limit(1);

    if (existing[0])
      throw errorCode("USERNAME_EXISTS");

    const password_hash = await bcrypt.hash(data.password, 12);

    await db.insert(usersTable).values({
      username: data.username,
      password_hash,
    });

    const created = await db
      .select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.username, data.username))
      .limit(1);

    const user = created[0];
    if (!user)
      throw errorCode("USER_NOT_FOUND")

    await createSession(user.id);
    return { id: user.id, username: user.username };
  });

export const authLogout = createServerFn({ method: "POST" }).handler(
  async () => {
    await destroySession();
    return { ok: true };
  }
);
