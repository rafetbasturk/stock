import { createMiddleware } from '@tanstack/react-start'

const PUBLIC_SERVER_FN_ALLOWLIST = new Set([
  'src/server/auth/index.ts:authLogin',
  'src/server/auth/index.ts:authMe',
  'src/server/auth/index.ts:authLogout',
  'src/routes/__root.tsx:getServerCookies',
])

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next, serverFnMeta }) => {
    const serverFnId = `${serverFnMeta.filename}:${serverFnMeta.name}`

    if (PUBLIC_SERVER_FN_ALLOWLIST.has(serverFnId)) {
      return next()
    }

    const { requireAuth } = await import('@/server/auth/requireAuth')
    await requireAuth()
    return next()
  },
)
