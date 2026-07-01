self.addEventListener('push', (event) => {
  const fallback = {
    title: 'Сегодня списание',
    body: 'Проверь подписки в Sub Tracker.',
    url: '/',
  };

  let payload = fallback;

  try {
    payload = event.data ? event.data.json() : fallback;
  } catch (_err) {
    payload = fallback;
  }

  const title = payload.title || fallback.title;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || fallback.body,
      data: { url: payload.url || fallback.url },
      tag: payload.tag || 'subscription-charge',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const visibleClient = clients.find((client) => client.url.includes(self.location.origin));

      if (visibleClient) {
        visibleClient.focus();
        return;
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});
