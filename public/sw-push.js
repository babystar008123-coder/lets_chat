self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Listener for messages sent from the page while backgrounded or locked
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body } = event.data;
    const options = {
      body: body || "You have a new message!",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [300, 100, 300, 100, 300],
      tag: "letschat-priority-msg",
      renotify: true,
      requireInteraction: true,
      data: {
        url: "/"
      }
    };
    self.registration.showNotification(title || "LetsChat", options);
  }
});

self.addEventListener("push", function (event) {
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

  const options = {
    body: body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [300, 100, 300, 100, 300],
    tag: "letschat-priority-msg",
    renotify: true,
    requireInteraction: true,
    data: {
      url: "/"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
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
