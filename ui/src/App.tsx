import { useEffect } from "react";
import { Navigation } from "./middleware/navigation";

function App() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[Client] ✅ Service worker registered:", registration);

          // Check for updates
          registration.onupdatefound = () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.onstatechange = () => {
                if (newWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    // New update found
                    console.log("[App] 🔄 New version available");

                    // Ask the new SW to skip waiting
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                  } else {
                    console.log("[App] ✔ App is ready for offline use");
                  }
                }
              };
            }
          };

          // Push subscription (optional)
          return registration.pushManager.getSubscription();
        })
        .then((subscription) => {
          if (subscription) {
            console.log("[Client] 📦 Current subscription:", subscription);
            console.log("[Client] 🔑 Endpoint:", subscription.endpoint);
            console.log("[Client] 🔑 Keys:", {
              p256dh: subscription.getKey("p256dh"),
              auth: subscription.getKey("auth"),
            });
          }
        })
        .catch((err) => {
          console.error("[Client] ❌ Service worker registration failed:", err);
        });

      // Reload when new SW takes control
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[App] ⚡ Controller changed — reloading...");
        window.location.reload();
      });
    }
  }, []);

  return (
    <div>
      <Navigation />
    </div>
  );
}

export default App;
