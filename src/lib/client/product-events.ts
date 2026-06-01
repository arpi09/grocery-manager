const CLIENT_EVENT_TYPES = [
	'register_click',
	'pwa_banner_dismiss',
	'pwa_banner_install_click'
] as const;

export type ClientProductEventType = (typeof CLIENT_EVENT_TYPES)[number];

export interface TrackProductEventOptions {
	eventType: ClientProductEventType;
	metadata?: Record<string, unknown>;
}

export async function trackProductEvent(
	eventType: ClientProductEventType,
	metadata?: Record<string, unknown>
): Promise<void> {
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
