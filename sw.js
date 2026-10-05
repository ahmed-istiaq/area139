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
      body: event.data
        ? event.data.text()
        : 'A new post has been published.'
    };
  }

  const title = data.title || 'AREA_139';

  const options = {
    body: data.body || 'A new post has been published.',
    icon: data.icon || '/area139/assets/Website/logo.jpg',
    badge: data.badge || '/area139/assets/Website/logo.jpg',
    ...(data.image ? { image: data.image } : {}),

    // Leave silent unset so the phone/browser uses
    // its normal notification sound settings.
    // Vibrate provides an additional alert where supported.
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


/* =========================================================
   UPDATED NOTIFICATION CLICK HANDLER
   ========================================================= */

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};

  let target = self.registration.scope;

  try {
    target = new URL(
      data.url || target,
      self.registration.scope
    ).href;
  } catch (_) {}

  event.waitUntil((async () => {

    const wins = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    // Find an already-open AREA_139 window
    const open = wins.find((c) =>
      c.url.startsWith(self.registration.scope)
    );

    if (open) {

      // Focus the existing AREA_139 window
      try {
        await open.focus();
      } catch (_) {}

      let navigated = false;

      // Try to navigate directly to the notification URL
      if ('navigate' in open) {
        try {
          await open.navigate(target);
          navigated = true;
        } catch (_) {}
      }

      // Fallback if navigation fails
      if (!navigated) {
        open.postMessage({
          type: 'a139-open-post',
          url: target
        });
      }

      return;
    }

    // No AREA_139 window is open → open a new one
    return clients.openWindow(target);

  })());
});