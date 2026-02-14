import { createMiddleware } from '@tanstack/react-start'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const { requireAuth } = await import('@/server/auth/requireAuth')

    const user = await requireAuth()

    return next({
      context: {
        user,
      },
    })
  },
)
