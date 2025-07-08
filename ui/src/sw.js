import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// ✅ Required: Precache manifest injected by Vite PWA
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ✅ Log to confirm service worker loads
console.log('[SW] Service worker loaded and active');

// 🔁 Activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ✅ Enhanced push event handler with detailed logging
self.addEventListener('push', event => {
  console.log('[SW] 🔔 Push event received:', event);
  console.log('[SW] Push data available:', !!event.data);
  
  if (event.data) {
    console.log('[SW] Raw push data:', event.data.text());
  }

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new update',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    data: {},
    tag: 'test-notification', // Add tag for debugging
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[SW] Parsed push data:', data);
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
      // Use text data if JSON parsing fails
      notificationData.body = event.data.text();
    }
  }

  console.log('[SW] Final notification data:', notificationData);

  const showNotification = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.tag,
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true,
  }).then(() => {
    console.log('[SW] ✅ Notification shown successfully');
  }).catch(error => {
    console.error('[SW] ❌ Failed to show notification:', error);
  });

  event.waitUntil(showNotification);
});

// ✅ Add push subscription change handler
self.addEventListener('pushsubscriptionchange', event => {
  console.log('[SW] Push subscription changed:', event);
  // Handle subscription changes here
});

// ✅ Test notification function (can be called from console)
self.testNotification = () => {
  console.log('[SW] Testing notification...');
  return self.registration.showNotification('Test Notification', {
    body: 'This is a test notification from service worker',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: 'manual-test',
    requireInteraction: true,
  });
};

// ✅ Check notification permission on load
console.log('[SW] Notification permission:', Notification.permission);
console.log('[SW] Service worker registration:', self.registration);

// Browser-side debugging utilities
// Add this to your main app or run in console:

// Test 1: Check notification permission
console.log('🔍 Notification permission:', Notification.permission);

// Test 2: Check service worker registration
navigator.serviceWorker.ready.then(registration => {
  console.log('🔍 Service worker ready:', registration);
  console.log('🔍 Push manager:', registration.pushManager);
  
  // Test 3: Get current subscription
  return registration.pushManager.getSubscription();
}).then(subscription => {
  console.log('🔍 Current subscription:', subscription);
  if (subscription) {
    console.log('🔍 Endpoint:', subscription.endpoint);
    console.log('🔍 Keys:', {
      p256dh: subscription.getKey('p256dh'),
      auth: subscription.getKey('auth')
    });
  }
});

// Test 4: Manual notification test
const testManualNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('Manual Test', {
      body: 'This is a manual test notification',
      icon: '/pwa-192x192.png'
    });
  } else {
    console.log('❌ Notification permission not granted');
  }
};

// Test 5: Service worker notification test
const testServiceWorkerNotification = () => {
  navigator.serviceWorker.ready.then(registration => {
    return registration.showNotification('SW Test', {
      body: 'This is a service worker test notification',
      icon: '/pwa-192x192.png',
      tag: 'sw-test'
    });
  }).then(() => {
    console.log('✅ Service worker notification sent');
  }).catch(error => {
    console.error('❌ Service worker notification failed:', error);
  });
};

// Test 6: Check if notifications are blocked
const checkNotificationBlock = () => {
  if ('Notification' in window) {
    console.log('🔍 Notifications supported');
    console.log('🔍 Permission:', Notification.permission);
    
    if (Notification.permission === 'denied') {
      console.log('❌ Notifications are blocked by user');
    } else if (Notification.permission === 'default') {
      console.log('⚠️ Notification permission not requested yet');
    } else {
      console.log('✅ Notifications are allowed');
    }
  } else {
    console.log('❌ Notifications not supported');
  }
};

// Run all tests
console.log('🚀 Running notification debugging tests...');
checkNotificationBlock();
testManualNotification();
testServiceWorkerNotification();

// ✅ SPA Fallback: Cache navigation requests (HTML) with NetworkFirst
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'html-cache',
    })
  )
);

// ✅ GraphQL Background Sync (POSTs)
const bgSyncPlugin = new BackgroundSyncPlugin('gql-mutations-queue', {
  maxRetentionTime: 24 * 60, // 24 hours
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

// ✅ Cache images with CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ✅ Cache manifest.json with StaleWhileRevalidate
registerRoute(
  ({ url }) => url.pathname.endsWith('manifest.json'),
  new StaleWhileRevalidate({
    cacheName: 'manifest-cache',
  })
);
