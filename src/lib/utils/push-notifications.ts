import { getLocale } from '$lib/i18n';
import { translate } from '$lib/i18n/messages';

export function isPushSupported(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	return (
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const output = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; i += 1) {
		output[i] = rawData.charCodeAt(i);
	}
	return output;
}

async function fetchVapidPublicKey(): Promise<string> {
	const response = await fetch('/api/push/vapid-public-key');
	if (!response.ok) {
		throw new Error('push_not_configured');
	}
	const data = (await response.json()) as { publicKey?: string };
	if (!data.publicKey) {
		throw new Error('push_not_configured');
	}
	return data.publicKey;
}

export type PushSubscribeFailureReason =
	| 'unsupported'
	| 'denied'
	| 'not_configured'
	| 'failed';

export type PushSubscribeResult = { ok: true } | { ok: false; reason: PushSubscribeFailureReason };

export async function subscribeToExpiryPush(): Promise<PushSubscribeResult> {
	if (!isPushSupported()) {
		return { ok: false, reason: 'unsupported' };
	}

	const permission = await Notification.requestPermission();
	if (permission !== 'granted') {
		return { ok: false, reason: 'denied' };
	}

	try {
		const publicKey = await fetchVapidPublicKey();
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
		});

		const json = subscription.toJSON();
		if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
			return { ok: false, reason: 'failed' };
		}

		const response = await fetch('/api/push/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				endpoint: json.endpoint,
				keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
			})
		});

		if (!response.ok) {
			return { ok: false, reason: response.status === 503 ? 'not_configured' : 'failed' };
		}

		return { ok: true };
	} catch (error) {
		if (error instanceof Error && error.message === 'push_not_configured') {
			return { ok: false, reason: 'not_configured' };
		}
		return { ok: false, reason: 'failed' };
	}
}

export async function unsubscribeFromExpiryPush(): Promise<void> {
	if (!isPushSupported()) {
		return;
	}

	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();
	if (!subscription) {
		return;
	}

	await fetch('/api/push/unsubscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ endpoint: subscription.endpoint })
	});
	await subscription.unsubscribe();
}

export function pushErrorMessage(reason: PushSubscribeFailureReason): string {
	const locale = getLocale();
	switch (reason) {
		case 'unsupported':
			return translate(locale, 'settings.pushNotifications.errors.unsupported');
		case 'denied':
			return translate(locale, 'settings.pushNotifications.errors.denied');
		case 'not_configured':
			return translate(locale, 'settings.pushNotifications.errors.notConfigured');
		default:
			return translate(locale, 'settings.pushNotifications.errors.failed');
	}
}
