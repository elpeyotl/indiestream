// Shared auth for the transcoding worker endpoints.
// Verifies the x-transcoding-secret header against the configured secret in a
// fail-closed, timing-safe manner.
import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export function requireTranscodingAuth(event: H3Event): void {
  const config = useRuntimeConfig()
  const provided = getHeader(event, 'x-transcoding-secret')
  const expected = config.transcodingSecret

  // Fail closed: never authorize when the secret is unset/empty or the header
  // is missing (otherwise `undefined === undefined` would pass).
  if (!expected || !provided) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
