import { Route as RootRoute } from '@/routes/__root'

export function useAppTimeZone() {
  const { settings } = RootRoute.useRouteContext()
  return settings.timeZone || 'UTC'
}
