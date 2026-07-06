// In-memory sliding-window rate limiter, keyed by client IP + route.
// Per-instance only: on Vercel each serverless instance has its own store,
// so real-world limits are roughly (configured limit × warm instances).
// Good enough as abuse protection for launch; swap for a shared store
// (Upstash/Redis) if limits ever need to be exact.
import type { H3Event } from 'h3'

interface RateLimitOptions {
  /** Maximum number of requests allowed per window */
  max: number
  /** Window size in milliseconds */
  windowMs: number
  /**
   * Bucket name so different endpoints don't share counters.
   * Defaults to the request path (dynamic routes should set this
   * explicitly, otherwise every path parameter gets its own bucket).
   */
  name?: string
  /** Message returned to the client on 429 */
  message?: string
}

const buckets = new Map<string, number[]>()

// Sweep stale entries occasionally so the map doesn't grow unbounded
// on long-lived instances.
let lastSweep = 0
const SWEEP_INTERVAL_MS = 10 * 60 * 1000
const MAX_WINDOW_MS = 60 * 60 * 1000

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, timestamps] of buckets) {
    if (timestamps.length === 0 || timestamps[timestamps.length - 1] < now - MAX_WINDOW_MS) {
      buckets.delete(key)
    }
  }
}

export function getClientIp(event: H3Event): string {
  // Vercel sets x-forwarded-for; the client IP is the first entry.
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return getHeader(event, 'x-real-ip') || event.node.req.socket?.remoteAddress || 'unknown'
}

/**
 * Throws a 429 error if the caller has exceeded the limit for this
 * endpoint; otherwise records the request and returns.
 */
export function enforceRateLimit(event: H3Event, options: RateLimitOptions): void {
  const now = Date.now()
  sweep(now)

  const ip = getClientIp(event)
  const bucket = options.name || event.path.split('?')[0]
  const key = `${bucket}:${ip}`
  const windowStart = now - options.windowMs

  const timestamps = (buckets.get(key) || []).filter((t) => t > windowStart)

  if (timestamps.length >= options.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((timestamps[0] + options.windowMs - now) / 1000))
    setHeader(event, 'Retry-After', retryAfterSeconds)
    throw createError({
      statusCode: 429,
      statusMessage: options.message || 'Too many requests. Please try again later.',
    })
  }

  timestamps.push(now)
  buckets.set(key, timestamps)
}
