import { goto } from '$app/navigation';
import { browser } from '$app/environment';

/** Pure check — referrer URL shares origin with the given app origin. */
export function isSameOriginReferrer(referrer: string, origin: string): boolean {
	if (!referrer) {
		return false;
	}

	try {
		return new URL(referrer).origin === origin;
	} catch {
		return false;
	}
}

/** True when the browser has a same-origin referrer (safe to use history.back). */
export function hasSameOriginReferrer(): boolean {
	if (!browser || typeof document === 'undefined') {
		return false;
	}

	return isSameOriginReferrer(document.referrer, window.location.origin);
}

/** Prefer browser back when entry was in-app; otherwise navigate to fallback. */
export async function navigateBack(fallbackHref: string): Promise<void> {
	if (hasSameOriginReferrer()) {
		history.back();
		return;
	}

	await goto(fallbackHref);
}
