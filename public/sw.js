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
    const data = payload.data || {};
    const title = data.title || "SurShongi";
    return self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    });
  });
} catch {
  // The installed app still opens if Firebase cannot be loaded.
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

const CACHE = "surshongi-static-v1";
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
