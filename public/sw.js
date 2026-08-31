// LFX Trading System Service Worker
const CACHE_NAME = 'lfx-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/app-icon.svg',
  '/lfx-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW cache.addAll warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background Push & Mobile Status Bar Notification Support
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 SINYAL XAU/USD BARU (LFX Trading System)',
    body: 'Sinyal baru terkonfirmasi di terminal LFX. Buka aplikasi untuk rincian Entry, SL 50 pips, & TP1-4.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'gold-signal-alert',
    vibrate: [200, 100, 200, 100, 300],
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || `lfx-signal-${Date.now()}`,
    vibrate: data.vibrate || [200, 100, 200, 100, 300],
    renotify: true,
    requireInteraction: false,
    data: data.data || { url: '/' },
    actions: [
      { action: 'open_signal', title: '📈 Buka Sinyal' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Background Message Handler for direct app-to-service-worker triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const notifOptions = {
      body: options?.body || 'Pemberitahuan Sinyal Emas Baru',
      icon: options?.icon || '/icon-192.png',
      badge: options?.badge || '/icon-192.png',
      tag: options?.tag || `lfx-msg-${Date.now()}`,
      vibrate: options?.vibrate || [300, 100, 300, 100, 400],
      renotify: true,
      requireInteraction: false,
      data: options?.data || { url: '/' },
      actions: [
        { action: 'open_signal', title: '📈 Buka Sinyal' },
        { action: 'close', title: 'Tutup' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title || '🚨 SINYAL BARU LFX TRADING', notifOptions)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

