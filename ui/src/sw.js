import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst, NetworkOnly, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { BackgroundSyncPlugin } from "workbox-background-sync";

// Make sure self is defined (global scope in service worker)
self.addEventListener("install", () => {
  self.skipWaiting(); // Activate the new SW immediately
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim()); // Take control of clients immediately
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Precache assets (this is injected by Workbox during the build process)
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// SPA fallback: Cache HTML pages with NetworkFirst strategy
registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: "html-cache" })
  )
);

// Background sync for GraphQL POST requests
const bgSyncPlugin = new BackgroundSyncPlugin("gql-mutations-queue", {
  maxRetentionTime: 24 * 60, // 24 hours
});

registerRoute(
  ({ url, request }) =>
    request.method === "POST" &&
    url.hostname === "api.winnemart.com" &&
    url.pathname === "/query",
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "POST"
);

// Cache images using CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache manifest.json with StaleWhileRevalidate strategy
registerRoute(
  ({ url }) => url.pathname.endsWith("manifest.json"),
  new StaleWhileRevalidate({
    cacheName: "manifest-cache",
  })
);
