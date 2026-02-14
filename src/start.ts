// src/start.ts
import { createStart } from '@tanstack/react-start'
import { settingsMiddleware } from './middleware/settings'

export const startInstance = createStart(() => ({
  requestMiddleware: [settingsMiddleware],
}))
