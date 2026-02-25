import { createMiddleware } from '@tanstack/react-start'

export const serverFnDebugMiddleware = createMiddleware({
  type: 'function',
}).server(async (args) => {
  const { next, serverFnMeta } = args

  if (process.env.NODE_ENV === 'production') {
    return next()
  }

  const startedAt = Date.now()
  const request = (args as { request?: Request }).request

  console.info('[server-fn] start', {
    file: serverFnMeta.filename,
    name: serverFnMeta.name,
    method: request?.method ?? 'unknown',
    url: request?.url ?? 'unknown',
  })

  try {
    const result = await next()
    console.info('[server-fn] success', {
      file: serverFnMeta.filename,
      name: serverFnMeta.name,
      durationMs: Date.now() - startedAt,
    })
    return result
  } catch (error) {
    console.error('[server-fn] error', {
      file: serverFnMeta.filename,
      name: serverFnMeta.name,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
