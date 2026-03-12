/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, setCatchHandler } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// Precache static assets (injected by vite-pwa at build time)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Cache Supabase API requests with NetworkFirst
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60,
      }),
    ],
  }),
)

// Navigation requests: try network first with a timeout
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 3,
  }),
)

// Global catch handler: when any route throws (e.g. offline),
// serve the cached /offline page for navigation requests
setCatchHandler(async ({ request }) => {
  if (typeof request !== 'string' && request.mode === 'navigate') {
    // Try to serve the cached /offline page
    const cache = await caches.open('pages-cache')
    const offlineResponse = await cache.match('/offline')
    if (offlineResponse) return offlineResponse

    // Fallback: minimal offline HTML
    return new Response(
      '<html><body style="background:#09090b;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>You\'re offline</h1><p>Check your connection and try again.</p></div></body></html>',
      { headers: { 'Content-Type': 'text/html' }, status: 503 },
    )
  }

  return Response.error()
})

// Pre-cache the /offline page on activation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('pages-cache').then(cache => cache.add('/offline').catch(() => {})),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
