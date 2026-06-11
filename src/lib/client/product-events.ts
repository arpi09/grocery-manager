import { hasClientAnalyticsConsent } from '$lib/client/cookie-consent';

const CLIENT_EVENT_TYPES = [
	'register_click',
	'onboarding_skipped',
	'onboarding_quickstart',
	'onboarding_completed',
	'pwa_banner_dismiss',
	'pwa_banner_install_click',
	'shopping_list_export',
	'receipt_import_started',
	'receipt_uploaded',
	'receipt_review_completed',
	'price_memory_viewed',
	'replenishment_suggestion_shown',
	'shopping_list_share_created',
	'household_invite_prompt_shown',
	'household_invite_prompt_clicked',
	'household_invite_prompt_dismissed',
	'household_invite_created'
] as const;

export const PUBLIC_ACQUISITION_EVENT_TYPES = [
	'shopping_list_share_viewed',
	'shopping_list_share_cta_clicked',
	'public_city_feed_viewed',
	'public_city_feed_item_clicked',
	'public_city_feed_signup_clicked',
	'expiring_share_viewed',
	'expiring_share_cta_clicked'
] as const;

export type ClientProductEventType = (typeof CLIENT_EVENT_TYPES)[number];
export type PublicAcquisitionEventType = (typeof PUBLIC_ACQUISITION_EVENT_TYPES)[number];

export interface TrackProductEventOptions {
	eventType: ClientProductEventType;
	metadata?: Record<string, unknown>;
}

export interface TrackPublicAcquisitionEventOptions {
	eventType: PublicAcquisitionEventType;
	metadata?: Record<string, unknown>;
}

const PUBLIC_CLIENT_EVENTS = new Set<ClientProductEventType>(['register_click']);

async function postProductEvent(
	eventType: string,
	metadata?: Record<string, unknown>
): Promise<void> {
	try {
		await fetch('/api/product-events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ eventType, metadata })
		});
	} catch {
		// Best-effort analytics — never block UX
	}
}

export async function trackProductEvent(
	eventType: ClientProductEventType,
	metadata?: Record<string, unknown>
): Promise<void> {
	if (PUBLIC_CLIENT_EVENTS.has(eventType) && !hasClientAnalyticsConsent()) {
		return;
	}

	await postProductEvent(eventType, metadata);
}

export async function trackPublicAcquisitionEvent(
	eventType: PublicAcquisitionEventType,
	metadata?: Record<string, unknown>
): Promise<void> {
	if (!hasClientAnalyticsConsent()) {
		return;
	}

	await postProductEvent(eventType, metadata);
}

export function isClientProductEventType(value: string): value is ClientProductEventType {
	return (CLIENT_EVENT_TYPES as readonly string[]).includes(value);
}

export function isPublicAcquisitionEventType(value: string): value is PublicAcquisitionEventType {
	return (PUBLIC_ACQUISITION_EVENT_TYPES as readonly string[]).includes(value);
}
