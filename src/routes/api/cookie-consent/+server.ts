import { json } from '@sveltejs/kit';
import { hasAnalyticsConsent, type CookieConsentChoice } from '$lib/cookie-consent';
import {
	clearNonEssentialAnalyticsCookies,
	writeCookieConsent
} from '$lib/infrastructure/cookie-consent-cookie';
import {
	isLandingHeroVariant,
	LANDING_VARIANT_COOKIE,
	type LandingHeroVariant
} from '$lib/marketing/landing-variants';
import type { RequestHandler } from './$types';

const LANDING_VARIANT_MAX_AGE = 60 * 60 * 24 * 90;

function isConsentChoice(value: unknown): value is CookieConsentChoice {
	return value === 'all' || value === 'essential';
}

function parseLandingVariant(value: unknown): LandingHeroVariant | null {
	return typeof value === 'string' && isLandingHeroVariant(value) ? value : null;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: { choice?: unknown; landingVariant?: unknown };
	try {
		body = (await request.json()) as { choice?: unknown; landingVariant?: unknown };
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
	}

	if (!isConsentChoice(body.choice)) {
		return json({ ok: false, error: 'Invalid choice' }, { status: 400 });
	}

	writeCookieConsent(cookies, body.choice);

	if (!hasAnalyticsConsent(body.choice)) {
		clearNonEssentialAnalyticsCookies(cookies);
		return json({ ok: true, choice: body.choice });
	}

	const variant = parseLandingVariant(body.landingVariant);
	if (variant) {
		cookies.set(LANDING_VARIANT_COOKIE, variant, {
			path: '/',
			maxAge: LANDING_VARIANT_MAX_AGE,
			httpOnly: false,
			sameSite: 'lax'
		});
	}

	return json({ ok: true, choice: body.choice });
};
