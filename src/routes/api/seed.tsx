import { createFileRoute } from '@tanstack/react-router'
import { seedDatabase } from '@/server/seed'

export const Route = createFileRoute('/api/seed')({
  server: {
    handlers: {
      POST: async () => {
        const result = await seedDatabase()

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
