/* Push notification handlers — loaded by the vite-pwa service worker via importScripts. */
self.addEventListener('push', (event) => {
	const payload = parsePushPayload(event);
	const title = payload.title || 'Home Pantry';
	const options = {
		body: payload.body || '',
		tag: payload.tag || 'home-pantry-expiry',
		icon: '/favicon.svg',
		badge: '/favicon.svg',
		data: { url: payload.url || '/hem' }
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = (event.notification.data && event.notification.data.url) || '/hem';
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			for (const client of clients) {
				if (client.url.includes(url) && 'focus' in client) {
					return client.focus();
				}
			}
			return self.clients.openWindow(url);
		})
	);
});

function parsePushPayload(event) {
	if (!event.data) {
		return {};
	}
	try {
		return event.data.json();
	} catch {
		return { body: event.data.text() };
	}
}
