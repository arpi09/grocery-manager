import { hasClientAnalyticsConsent } from '$lib/client/cookie-consent';

const CLIENT_EVENT_TYPES = [
	'register_click',
	'onboarding_skipped',
	'onboarding_quickstart',
	'onboarding_completed',
	'pwa_banner_dismiss',
	'pwa_banner_install_click',
	'shopping_list_export'
] as const;

export type ClientProductEventType = (typeof CLIENT_EVENT_TYPES)[number];

export interface TrackProductEventOptions {
	eventType: ClientProductEventType;
	metadata?: Record<string, unknown>;
}

const PUBLIC_CLIENT_EVENTS = new Set<ClientProductEventType>(['register_click']);

export async function trackProductEvent(
	eventType: ClientProductEventType,
	metadata?: Record<string, unknown>
): Promise<void> {
	if (PUBLIC_CLIENT_EVENTS.has(eventType) && !hasClientAnalyticsConsent()) {
		return;
	}

	try {
		await fetch('/api/product-events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ eventType, metadata } satisfies TrackProductEventOptions)
		});
	} catch {
		// Best-effort analytics — never block UX
	}
}

export function isClientProductEventType(value: string): value is ClientProductEventType {
	return (CLIENT_EVENT_TYPES as readonly string[]).includes(value);
}
