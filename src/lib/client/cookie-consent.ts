import { COOKIE_CONSENT_NAME, parseCookieConsent, type CookieConsentChoice } from '$lib/cookie-consent';
import {
	isLandingHeroVariant,
	type LandingHeroVariant
} from '$lib/marketing/landing-variants';
import { readLandingVariantSession } from '$lib/client/landing-variant-session';

export function readCookieConsentFromDocument(): CookieConsentChoice | null {
	if (typeof document === 'undefined') {
		return null;
	}
	const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_CONSENT_NAME}=([^;]*)`));
	return parseCookieConsent(match?.[1] ? decodeURIComponent(match[1]) : null);
}

export function hasClientAnalyticsConsent(): boolean {
	return readCookieConsentFromDocument() === 'all';
}

export async function submitCookieConsent(
	choice: CookieConsentChoice,
	landingVariant?: LandingHeroVariant | null
): Promise<boolean> {
	const variant =
		landingVariant ??
		readLandingVariantSession() ??
		(typeof window !== 'undefined'
			? (() => {
					const params = new URLSearchParams(window.location.search);
					const hero = params.get('hero')?.trim().toLowerCase();
					return isLandingHeroVariant(hero) ? hero : null;
				})()
			: null);

	try {
		const response = await fetch('/api/cookie-consent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				choice,
				...(variant ? { landingVariant: variant } : {})
			})
		});
		return response.ok;
	} catch {
		return false;
	}
}
