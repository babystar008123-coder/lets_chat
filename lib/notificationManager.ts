export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === "granted" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification("LetsChat Active 🔔", {
        body: "Lockscreen and multi-app notifications are now ready!",
        icon: "/icon-192x192.png",
        vibrate: [200, 100, 200],
        tag: "letschat-perm-ok",
      });
      return true;
    }
  } catch (e) {
    console.error("Error requesting notification permission:", e);
  }
  return false;
}

export function triggerLockscreenNotification(senderName: string, content: string) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  if (document.hidden) {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title: `New message from ${senderName}`,
        body: content || "Sent you a message",
      });
    } else if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(`New message from ${senderName}`, {
          body: content || "Sent you a message",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          vibrate: [300, 100, 300, 100, 300],
          tag: "letschat-msg",
          renotify: true,
          requireInteraction: true,
        });
      });
    }
  }
}
