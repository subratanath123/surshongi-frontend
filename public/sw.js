try {
  importScripts("https://www.gstatic.com/firebasejs/13.3.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/13.3.0/firebase-messaging-compat.js");
  firebase.initializeApp({
    apiKey: "AIzaSyCpD-HTRWsQy3mgxTHwtVLNiIQWj88gpu8",
    authDomain: "sur-shongi.firebaseapp.com",
    projectId: "sur-shongi",
    storageBucket: "sur-shongi.firebasestorage.app",
    messagingSenderId: "563809041872",
    appId: "1:563809041872:web:d1a5cbf411a956f16d8dd5",
  });
  firebase.messaging().onBackgroundMessage((payload) => {
    const note = payload.notification || {};
    if (note.title) return;
    const data = payload.data || {};
    const title = data.title || "SurShongi";
    const body = data.body || "";
    const url = (payload.fcmOptions && payload.fcmOptions.link) || data.url || "/";
    return self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      data: { url },
    });
  });
  self.addEventListener("push", (event) => {
    event.waitUntil(showWhenMinimized(event));
  });
} catch {
  self.addEventListener("push", (event) => {
    let payload = {};
    try {
      payload = event.data ? event.data.json() : {};
    } catch {
      payload = {};
    }
    const note = payload.notification || {};
    const data = payload.data || {};
    const title = note.title || data.title || "SurShongi";
    const body = note.body || data.body || "";
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        data: { url: (payload.fcmOptions && payload.fcmOptions.link) || data.url || "/" },
      }),
    );
  });
}

async function showWhenMinimized(event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const note = payload.notification || {};
  const data = payload.data || {};
  const title = note.title || data.title;
  if (!title) return;
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const visible = windows.some((client) => client.visibilityState === "visible");
  const focused = windows.some((client) => client.focused);
  if (!visible || focused) return;
  await self.registration.showNotification(title, {
    body: note.body || data.body || "",
    icon: "/icons/icon-192.png",
    data: { url: data.url || note.click_action || "/" },
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});

const CACHE = "surshongi-static-v3";
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/community") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/uploads") ||
    url.pathname.startsWith("/health")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fresh = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fresh;
      }),
    );
  }
});
