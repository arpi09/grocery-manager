export const COOKIE_CONSENT_NAME = 'hp_cookie_consent';

export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type CookieConsentChoice = 'all' | 'essential';

export function parseCookieConsent(value: string | null | undefined): CookieConsentChoice | null {
	const trimmed = value?.trim().toLowerCase();
	if (trimmed === 'all' || trimmed === 'essential') {
		return trimmed;
	}
	return null;
}

export function hasConsentChoice(choice: CookieConsentChoice | null): choice is CookieConsentChoice {
	return choice === 'all' || choice === 'essential';
}

/** Non-essential analytics / A/B cookies and anonymous product events. */
export function hasAnalyticsConsent(choice: CookieConsentChoice | null): boolean {
	return choice === 'all';
}
