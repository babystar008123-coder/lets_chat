self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches if any
    ])
  );
});

// Direct message listener from client tab
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const title = event.data.title || "LetsChat";
    const body = event.data.body || "You have a new message!";
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        vibrate: [400, 200, 400],
        tag: "letschat-new-msg",
        renotify: true,
        requireInteraction: true,
        data: { url: "/" },
      })
    );
  }
});

// Push notification listener
self.addEventListener("push", (event) => {
  let title = "LetsChat";
  let body = "You have a new message!";
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch (e) {
      body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [400, 200, 400],
      tag: "letschat-new-msg",
      renotify: true,
      requireInteraction: true,
      data: { url: "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
