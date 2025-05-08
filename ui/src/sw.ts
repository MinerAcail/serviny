import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst, NetworkOnly, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { BackgroundSyncPlugin } from "workbox-background-sync";

declare let self: ServiceWorkerGlobalScope;

// ✅ Precache assets
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ✅ SPA fallback
registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: "html-cache" })
  )
);

// ✅ Background sync for GraphQL POST requests
const bgSyncPlugin = new BackgroundSyncPlugin("gql-mutations-queue", {
  maxRetentionTime: 24 * 60, // 24 hours
});

registerRoute(
  ({ url, request }) =>
    request.method === "POST" &&
    url.hostname === "api.serviny.com" &&
    url.pathname === "/query",
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "POST"
);

// ✅ Cache images
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Cache manifest.json with fallback
registerRoute(
    ({ url }) => url.pathname.endsWith("manifest.json"),
    new StaleWhileRevalidate({
      cacheName: "manifest-cache",
    })
  );