/* Ascend Service Worker — daily reminders + minimal offline shell. */
/* global self, clients */

const CACHE = 'ascend-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/favicon.svg', '/manifest.webmanifest'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// Network-first for navigations so the latest app loads; cache as offline fallback.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/')));
  }
});

// Web Push — payload: { title, body }.
self.addEventListener('push', (event) => {
  let data = { title: 'Ascend — 今日の学習', body: '30分の学習を始めましょう。' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    /* keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'ascend-daily',
    }),
  );
});

// Allow the page to trigger a notification via postMessage (in-app scheduler path).
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'SHOW_REMINDER') {
    self.registration.showNotification(msg.title || 'Ascend — 今日の学習', {
      body: msg.body || '30分の学習を始めましょう。',
      icon: '/favicon.svg',
      tag: 'ascend-daily',
    });
  }
});

// Focus or open the app when a notification is clicked.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow('/today');
    }),
  );
});
