import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { BackgroundSyncPlugin } from "workbox-background-sync";

// Inject manifest
declare let self: ServiceWorkerGlobalScope;
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ✅ SPA fallback for navigation
registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: "html-cache" })
  )
);

// ✅ Cache GraphQL queries (POST) — api.serviny.com/query
registerRoute(
  ({ url, request }) =>
    request.method === "POST" && url.hostname === "api.serviny.com" && url.pathname === "/query",
  new NetworkFirst({
    cacheName: "graphql-query-cache",
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  "POST"
);

// ✅ Background sync for failed mutations
const bgSyncPlugin = new BackgroundSyncPlugin("gql-mutations-queue", {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  ({ url, request }) =>
    request.method === "POST" && url.hostname === "api.serviny.com" && url.pathname === "/query",
  new NetworkFirst({
    cacheName: "graphql-mutation-cache",
    plugins: [
      bgSyncPlugin,
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
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
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);
