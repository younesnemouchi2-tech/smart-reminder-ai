/*
 * Service Worker for مُذكّري الذكي (Smart Reminder AI)
 * - Caches app shell (HTML, CSS, JS, fonts, icons) for offline use
 * - Network-first for API requests (always fresh data when online)
 * - Cache-first for static assets
 * - Handles push notifications
 * - Handles notification clicks
 * - Falls back to offline page when network fails for navigation
 */

const CACHE_VERSION = "v1.1.0";
const STATIC_CACHE = `smart-reminder-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `smart-reminder-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// Assets to cache immediately on install (app shell)
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/logo.svg",
];

// Install: precache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Don't fail install if some assets aren't ready yet
        console.warn("[SW] Some precache URLs failed:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !key.includes(CACHE_VERSION))
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Helper: detect navigation requests
function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" && request.headers.get("accept")?.includes("text/html"))
  );
}

// Helper: detect API requests
function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // API requests: network-first (always get fresh data when online)
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a copy for offline fallback
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request);
        })
    );
    return;
  }

  // Navigation requests: network-first, fallback to cache, then offline page
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest version of the page
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Try cache first, then offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// ============================
// PUSH NOTIFICATIONS
// ============================

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "🔔 تذكير", body: event.data.text() };
    }
  }

  const title = payload.title || "🔔 تذكير";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || "smart-reminder",
    data: payload.data || { url: "/" },
    dir: "rtl",
    lang: "ar",
    requireInteraction: payload.requireInteraction || false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click: focus the app or open the URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  // Allow client to trigger local notifications via SW
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, tag, data } = event.data.payload || {};
    event.waitUntil(
      self.registration.showNotification(title || "🔔 تذكير", {
        body: body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: tag || "smart-reminder",
        data: data || { url: "/" },
        dir: "rtl",
        lang: "ar",
        vibrate: [200, 100, 200],
      })
    );
  }
});
