// Register Service Worker and request permissions automatically
export async function registerAndInitNotifications(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    console.log("Service Worker registered successfully with scope:", reg.scope);

    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    }
    return Notification.permission === "granted";
  } catch (err) {
    console.error("Failed to register Service Worker / Notification:", err);
    return false;
  }
}

// Request permission explicitly (for bell icon click)
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    alert("Notifications are not supported in this browser.");
    return false;
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification("LetsChat Notifications Active 🔔", {
          body: "You will now receive alerts even when your screen is locked or while watching YouTube!",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          vibrate: [200, 100, 200],
          tag: "letschat-active",
        });
      }
      return true;
    } else {
      alert("Notification permission was denied. Please enable it in browser settings.");
      return false;
    }
  } catch (e) {
    console.error("Error requesting notification permission:", e);
    return false;
  }
}

// Trigger high-priority heads-up notification
export function triggerLockscreenNotification(senderName: string, content: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Trigger whenever tab is in background or phone is locked / running another app
  if (document.hidden) {
    const title = `New message from ${senderName}`;
    const body = content || "Sent you a message";

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          vibrate: [400, 200, 400],
          tag: "letschat-new-msg",
          renotify: true,
          requireInteraction: true,
          data: { url: "/" },
        });
      }).catch((err) => {
        console.error("ServiceWorker showNotification error:", err);
        new Notification(title, { body, icon: "/icon-192x192.png" });
      });
    } else {
      new Notification(title, { body, icon: "/icon-192x192.png" });
    }
  }
}
