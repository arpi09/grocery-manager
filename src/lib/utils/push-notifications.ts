import { getLocale } from '$lib/i18n';
import { translate } from '$lib/i18n/messages';

const SERVICE_WORKER_REGISTER_WAIT_MS = 6_000;
const SERVICE_WORKER_READY_TIMEOUT_MS = 12_000;

let serviceWorkerRegistrationStarted = false;

function startServiceWorkerRegistration(): void {
	if (!isPushSupported() || serviceWorkerRegistrationStarted) {
		return;
	}
	serviceWorkerRegistrationStarted = true;
	void import('virtual:pwa-register')
		.then(({ registerSW }) => {
			registerSW({ immediate: true });
		})
		.catch(() => {
			serviceWorkerRegistrationStarted = false;
		});
}

export function isNotificationApiAvailable(): boolean {
	return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | null {
	if (!isNotificationApiAvailable()) {
		return null;
	}
	return window.Notification.permission;
}

export function isPushSupported(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	return (
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		isNotificationApiAvailable()
	);
}

async function waitForServiceWorkerRegistration(): Promise<boolean> {
	startServiceWorkerRegistration();

	const deadline = Date.now() + SERVICE_WORKER_REGISTER_WAIT_MS;
	while (Date.now() < deadline) {
		const existing = await navigator.serviceWorker.getRegistration();
		if (existing || navigator.serviceWorker.controller) {
			return true;
		}
		await new Promise((resolve) => window.setTimeout(resolve, 250));
	}
	const existing = await navigator.serviceWorker.getRegistration();
	return Boolean(existing || navigator.serviceWorker.controller);
}

/** True when APIs exist and a push-capable service worker is active (or will activate soon). */
export async function isPushServiceWorkerAvailable(): Promise<boolean> {
	if (!isPushSupported()) {
		return false;
	}

	if (!(await waitForServiceWorkerRegistration())) {
		return false;
	}

	try {
		await Promise.race([
			navigator.serviceWorker.ready,
			new Promise<never>((_, reject) => {
				window.setTimeout(() => reject(new Error('sw_timeout')), SERVICE_WORKER_READY_TIMEOUT_MS);
			})
		]);
		return true;
	} catch {
		return false;
	}
}

async function getPushServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
	if (!(await isPushServiceWorkerAvailable())) {
		return null;
	}
	return navigator.serviceWorker.ready;
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

async function postPushJson<T>(
	url: string,
	body: unknown = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
	const response = await fetch(url, {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		return { ok: false, status: response.status };
	}

	const data = (await response.json()) as T;
	return { ok: true, data };
}

async function fetchVapidPublicKey(): Promise<string> {
	const response = await fetch('/api/push/vapid-public-key', { credentials: 'same-origin' });
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
	| 'service_worker_unavailable'
	| 'denied'
	| 'not_configured'
	| 'failed';

export type PushSubscribeResult = { ok: true } | { ok: false; reason: PushSubscribeFailureReason };

async function disablePushOnServer(): Promise<PushSubscribeResult> {
	const response = await postPushJson<{ ok?: boolean }>('/api/push/disable');
	if (!response.ok) {
		return { ok: false, reason: response.status === 503 ? 'not_configured' : 'failed' };
	}
	if (response.data.ok !== true) {
		return { ok: false, reason: 'failed' };
	}
	return { ok: true };
}

/** Best-effort: drop browser push subscription without waiting for SW ready. */
async function unsubscribeBrowserPush(): Promise<void> {
	if (!isPushSupported()) {
		return;
	}

	try {
		const registration = await navigator.serviceWorker.getRegistration();
		const subscription = registration
			? await registration.pushManager.getSubscription()
			: null;
		if (subscription) {
			await subscription.unsubscribe();
		}
	} catch {
		// Browser cleanup is optional; server disable is authoritative.
	}
}

export async function subscribeToExpiryPush(): Promise<PushSubscribeResult> {
	if (!isPushSupported()) {
		return { ok: false, reason: 'unsupported' };
	}

	const permission = await window.Notification.requestPermission();
	if (permission !== 'granted') {
		return { ok: false, reason: 'denied' };
	}

	try {
		const registration = await getPushServiceWorkerRegistration();
		if (!registration) {
			return { ok: false, reason: 'service_worker_unavailable' };
		}

		const publicKey = await fetchVapidPublicKey();
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
		});

		const json = subscription.toJSON();
		if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
			return { ok: false, reason: 'failed' };
		}

		const response = await postPushJson<{ ok?: boolean }>('/api/push/subscribe', {
			endpoint: json.endpoint,
			keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
		});

		if (!response.ok) {
			return { ok: false, reason: response.status === 503 ? 'not_configured' : 'failed' };
		}
		if (response.data.ok !== true) {
			return { ok: false, reason: 'failed' };
		}

		return { ok: true };
	} catch (error) {
		if (error instanceof Error && error.message === 'push_not_configured') {
			return { ok: false, reason: 'not_configured' };
		}
		return { ok: false, reason: 'failed' };
	}
}

export async function unsubscribeFromExpiryPush(): Promise<PushSubscribeResult> {
	if (!isPushSupported()) {
		return disablePushOnServer();
	}

	await unsubscribeBrowserPush();
	return disablePushOnServer();
}

/** Re-register an existing browser subscription with the server (e.g. after reload drift). */
export async function resyncExistingPushSubscription(): Promise<PushSubscribeResult> {
	if (!isPushSupported()) {
		return { ok: false, reason: 'unsupported' };
	}
	if (getNotificationPermission() !== 'granted') {
		return { ok: false, reason: 'denied' };
	}

	try {
		const registration = await getPushServiceWorkerRegistration();
		if (!registration) {
			return { ok: false, reason: 'service_worker_unavailable' };
		}

		const subscription = await registration.pushManager.getSubscription();
		if (!subscription) {
			return { ok: false, reason: 'failed' };
		}

		const json = subscription.toJSON();
		if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
			return { ok: false, reason: 'failed' };
		}

		const response = await postPushJson<{ ok?: boolean }>('/api/push/subscribe', {
			endpoint: json.endpoint,
			keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
		});

		if (!response.ok) {
			return { ok: false, reason: response.status === 503 ? 'not_configured' : 'failed' };
		}
		if (response.data.ok !== true) {
			return { ok: false, reason: 'failed' };
		}

		return { ok: true };
	} catch {
		return { ok: false, reason: 'failed' };
	}
}

export function pushErrorMessage(reason: PushSubscribeFailureReason): string {
	const locale = getLocale();
	switch (reason) {
		case 'unsupported':
			return translate(locale, 'settings.pushNotifications.errors.unsupported');
		case 'service_worker_unavailable':
			return translate(locale, 'settings.pushNotifications.errors.serviceWorkerUnavailable');
		case 'denied':
			return translate(locale, 'settings.pushNotifications.errors.denied');
		case 'not_configured':
			return translate(locale, 'settings.pushNotifications.errors.notConfigured');
		default:
			return translate(locale, 'settings.pushNotifications.errors.failed');
	}
}
