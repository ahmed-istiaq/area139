self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = {
      title: 'AREA_139',
      body: event.data ? event.data.text() : 'A new post has been published.'
    };
  }

  const title = data.title || 'AREA_139';

  const options = {
    body: data.body || 'A new post has been published.',
    icon: data.icon || '/area139/assets/Website/logo.jpg',
    badge: data.badge || '/area139/assets/Website/logo.jpg',
    ...(data.image ? { image: data.image } : {}),
    // Leave silent unset so the phone/browser uses its normal notification
    // sound settings. Vibrate provides an additional alert where supported.
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/area139/'
    },
    tag: data.tag || 'area139-new-post',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl =
    event.notification.data?.url || '/area139/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
