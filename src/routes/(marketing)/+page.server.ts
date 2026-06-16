import { env as publicEnv } from '$env/dynamic/public';
import type { MarketingLocale } from '$lib/marketing/content';
import { hasAnalyticsConsent } from '$lib/cookie-consent';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import {
	getLandingHeroCopy,
	isReceiptHeroVariant,
	LANDING_VARIANT_COOKIE,
	mergeReceiptHeroExperiment,
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
	const queryReceiptHero = url.searchParams.get('receipt_hero');
	const variant = resolveLandingVariant({
		queryHero,
		cookieVariant: cookies.get(LANDING_VARIANT_COOKIE),
		envVariant: publicEnv.PUBLIC_LANDING_VARIANT,
		allowVariantCookie: analyticsAllowed
	});

	const trimmedReceiptHero = queryReceiptHero?.trim().toLowerCase() ?? null;
	const receiptHeroActive =
		trimmedReceiptHero != null && isReceiptHeroVariant(trimmedReceiptHero);
	const receiptHeroVariant = receiptHeroActive ? trimmedReceiptHero : null;

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
		variant,
		receiptHeroVariant: receiptHeroActive ? receiptHeroVariant : null
	});

	const baseHero = getLandingHeroCopy(variant, locale);
	const hero =
		receiptHeroActive && receiptHeroVariant
			? mergeReceiptHeroExperiment(baseHero, receiptHeroVariant, locale)
			: baseHero;

	return {
		landingVariant: variant,
		receiptHeroVariant: receiptHeroActive ? receiptHeroVariant : null,
		hero,
		latestGuides: await getLatestPublishedGuides(2, guideLoaderDepsFromService(locals.guideArticleService))
	};
};
