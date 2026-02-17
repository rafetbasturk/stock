import { useEffect } from 'react'

export function SetTimeZoneCookie() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (!tz) return

    document.cookie = `tz=${tz}; path=/; max-age=31536000; samesite=lax`
  }, [])

  return null
}
