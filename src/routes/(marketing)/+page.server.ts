import { env as publicEnv } from '$env/dynamic/public';
import type { MarketingLocale } from '$lib/marketing/content';
import { hasAnalyticsConsent } from '$lib/cookie-consent';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import {
	getLandingHeroCopy,
	LANDING_VARIANT_COOKIE,
	resolveLandingVariant
} from '$lib/marketing/landing-variants';
import { getLatestPublishedGuides } from '$lib/marketing/guides.server';
import { guideLoaderDepsFromService } from '$lib/marketing/guide-loader-deps';
import { pmfService } from '$lib/server/di';
import { recordMarketingEvent } from '$lib/server/marketing-analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, parent, locals }) => {
	const { marketingLocale } = await parent();
	const locale = (marketingLocale === 'en' ? 'en' : 'sv') satisfies MarketingLocale;
	const consent = readCookieConsent(cookies);
	const analyticsAllowed = hasAnalyticsConsent(consent);
	const queryHero = url.searchParams.get('hero');
	const variant = resolveLandingVariant({
		queryHero,
		cookieVariant: cookies.get(LANDING_VARIANT_COOKIE),
		envVariant: publicEnv.PUBLIC_LANDING_VARIANT,
		allowVariantCookie: analyticsAllowed
	});

	if (queryHero && (queryHero === 'a' || queryHero === 'b') && analyticsAllowed) {
		cookies.set(LANDING_VARIANT_COOKIE, variant, {
			path: '/',
			maxAge: 60 * 60 * 24 * 90,
			httpOnly: false,
			sameSite: 'lax'
		});
	}

	recordMarketingEvent({
		pmfService,
		cookies,
		eventType: 'landing_view',
		variant
	});

	return {
		landingVariant: variant,
		hero: getLandingHeroCopy(variant, locale),
		latestGuides: await getLatestPublishedGuides(3, guideLoaderDepsFromService(locals.guideArticleService))
	};
};
