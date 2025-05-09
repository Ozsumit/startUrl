// This file is used to enable offline functionality through service workers

// Define a version
const CACHE_NAME = "safari-startpage-v2"

// List of assets to cache
const STATIC_ASSETS = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png", "/favicon.ico"]

// Install event - cache static assets
self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    }),
  )
})

// Fetch event - serve from cache or fetch from network
self.addEventListener("fetch", (event: any) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return

  // Skip browser-extension requests and API requests
  const url = new URL(event.request.url)
  if (url.protocol === "chrome-extension:" || url.pathname.startsWith("/api/")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse
      }

      // Otherwise, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache the fetched response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If both cache and network fail, return a fallback
          if (event.request.mode === "navigate") {
            return caches.match("/")
          }
          return null
        })
    }),
  )
})

// Handle messages from clients
self.addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
