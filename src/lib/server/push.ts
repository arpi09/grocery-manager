import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import webpush from 'web-push';
import { getAppOrigin } from '$lib/server/origin';

let vapidConfigured = false;

export function getVapidPublicKey(): string | null {
	const key = publicEnv.PUBLIC_VAPID_PUBLIC_KEY?.trim();
	return key || null;
}

function getVapidPrivateKey(): string | null {
	const key = env.VAPID_PRIVATE_KEY?.trim();
	return key || null;
}

function getVapidSubject(): string {
	const contact = env.VAPID_CONTACT?.trim();
	if (contact) {
		return contact;
	}
	return getAppOrigin() || 'mailto:support@homepantry.com';
}

export function isPushConfigured(): boolean {
	return Boolean(getVapidPublicKey() && getVapidPrivateKey());
}

function ensureVapidConfigured(): boolean {
	if (vapidConfigured) {
		return true;
	}
	const publicKey = getVapidPublicKey();
	const privateKey = getVapidPrivateKey();
	if (!publicKey || !privateKey) {
		return false;
	}
	webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);
	vapidConfigured = true;
	return true;
}

export type SendPushFailure = { ok: false; reason: string; statusCode?: number };
export type SendPushResult = { ok: true; delivered: number } | SendPushFailure;

export interface PushPayload {
	title: string;
	body: string;
	url?: string;
	tag?: string;
}

export async function sendPushNotification(
	subscription: { endpoint: string; p256dh: string; auth: string },
	payload: PushPayload
): Promise<SendPushResult> {
	if (!ensureVapidConfigured()) {
		return { ok: false, reason: 'VAPID keys not configured' };
	}

	try {
		await webpush.sendNotification(
			{
				endpoint: subscription.endpoint,
				keys: {
					p256dh: subscription.p256dh,
					auth: subscription.auth
				}
			},
			JSON.stringify(payload)
		);
		return { ok: true, delivered: 1 };
	} catch (error) {
		const statusCode =
			error && typeof error === 'object' && 'statusCode' in error
				? (error as { statusCode?: number }).statusCode
				: undefined;
		const message = error instanceof Error ? error.message : 'Push send failed';
		return { ok: false, reason: message, statusCode };
	}
}

export function missingVapidKeysMessage(): string {
	return 'PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY saknas. Kör: npx web-push generate-vapid-keys';
}
