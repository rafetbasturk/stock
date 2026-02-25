// src/start.ts
import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './server/middleware/auth'
import { serverFnDebugMiddleware } from './server/middleware/serverFnDebug'
import { settingsMiddleware } from './middleware/settings'

export const startInstance = createStart(() => ({
  requestMiddleware: [settingsMiddleware],
  functionMiddleware: [serverFnDebugMiddleware, authMiddleware],
}))
