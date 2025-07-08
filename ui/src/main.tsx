import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Initialize PWA features
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    console.log('[Client] ✅ Service worker ready:', registration);
    console.log('[Client] 🔍 Push manager:', registration.pushManager);

    return registration.pushManager.getSubscription();
  }).then(subscription => {
    console.log('[Client] 📦 Current subscription:', subscription);
    if (subscription) {
      console.log('[Client] 🔑 Endpoint:', subscription.endpoint);
      console.log('[Client] 🔑 Keys:', {
        p256dh: subscription.getKey('p256dh'),
        auth: subscription.getKey('auth'),
      });
    }
  }).catch(err => {
    console.error('[Client] ❌ Failed to get push subscription:', err);
  });
}
