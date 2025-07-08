import { useEffect } from "react";

export function PushDebugTools() {
 const triggerNotification = async () => {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('Notifications not allowed.');
    return;
  }

  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    console.warn('[Client] ❌ No service worker registration found. Waiting for ready...');
    registration = await navigator.serviceWorker.ready;
  }

  if (!registration || !registration.showNotification) {
    alert('No valid service worker registration available.');
    return;
  }

  registration.showNotification('🔔 Manual Trigger', {
    body: 'This is a manual test notification',
    icon: '/pwa-192x192.png',
    requireInteraction: true,
    vibrate: [100, 50, 100],
    tag: 'manual-' + Date.now(),
    renotify: true,
  });

  console.log('[Client] ✅ Notification triggered via service worker');
};

  useEffect(() => {
    // ✅ Check if notifications are supported and their status
    const checkNotificationBlock = () => {
      if ("Notification" in window) {
        console.log("[Client] 🔍 Notifications supported");
        console.log("[Client] 🔍 Permission:", Notification.permission);

        if (Notification.permission === "denied") {
          console.log("[Client] ❌ Notifications are blocked by user");
        } else if (Notification.permission === "default") {
          console.log("[Client] ⚠️ Notification permission not requested yet");
        } else {
          console.log("[Client] ✅ Notifications are allowed");
        }
      } else {
        console.log("[Client] ❌ Notifications not supported");
      }
    };

    const testManualNotification = () => {
      if (Notification.permission === "granted") {
        new Notification("Manual Test", {
          body: "This is a manual test notification",
          icon: "/pwa-192x192.png",
        });
        console.log("[Client] ✅ Manual notification sent");
      } else {
        console.log("[Client] ❌ Notification permission not granted");
      }
    };

    // Run both tests after 3 seconds
    const timeout = setTimeout(() => {
      console.log("[Client] 🚀 Running push notification debug tests...");
      checkNotificationBlock();
      testManualNotification();
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <button
      onClick={triggerNotification}
      style={{
        padding: "1rem",
        background: "#0070f3",
        color: "white",
        borderRadius: 6,
      }}
    >
      🔔 Trigger Manual Notification
    </button>
  ); // no UI needed for now
}
