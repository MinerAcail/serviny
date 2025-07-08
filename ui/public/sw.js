import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  NetworkFirst,
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache assets
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

console.log('[SW] ✅ Service worker loaded and active');

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ✅ Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 Push event received:', event);

  let notificationData = {
    title: '🛎️ New Notification',
    body: 'You have a new update',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    data: { url: '/bookings' },
    tag: 'booking-test',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: '📄 View Booking' },
      { action: 'dismiss', title: '❌ Dismiss' },
    ],
  };

  if (event.data) {
    try {
      const raw = event.data.text();
      console.log('[SW] 📦 Raw push data:', raw);
      const parsed = JSON.parse(raw);
      console.log('[SW] ✅ Parsed push data:', parsed);

      notificationData = {
        ...notificationData,
        ...parsed,
        data: {
          ...notificationData.data,
          ...parsed.data,
        },
      };
    } catch (error) {
      console.error('[SW] ❌ Failed to parse push data:', error);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        data: notificationData.data,
        tag: notificationData.tag,
        actions: notificationData.actions,
        vibrate: notificationData.vibrate,
        requireInteraction: notificationData.requireInteraction,
      })
      .then(() => {
        console.log('[SW] ✅ Notification shown successfully');
      })
      .catch((error) => {
        console.error('[SW] ❌ Failed to show notification:', error);
      })
  );
});

// ✅ Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 📲 Notification clicked:', event.notification);
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// ✅ Push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] 🔄 Push subscription changed:', event);
});

// ✅ SPA fallback route
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'html-cache',
    })
  )
);

// ✅ GraphQL background sync
const bgSyncPlugin = new BackgroundSyncPlugin('gql-mutations-queue', {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  ({ url, request }) =>
    request.method === 'POST' &&
    url.hostname === 'api.winnemart.com' &&
    url.pathname === '/query',
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

// ✅ Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// ✅ Cache manifest
registerRoute(
  ({ url }) => url.pathname.endsWith('manifest.json'),
  new StaleWhileRevalidate({
    cacheName: 'manifest-cache',
  })
);
