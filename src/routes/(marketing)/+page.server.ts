import { env as publicEnv } from '$env/dynamic/public';
import type { MarketingLocale } from '$lib/marketing/content';
import {
	getLandingHeroCopy,
	LANDING_VARIANT_COOKIE,
	resolveLandingVariant
} from '$lib/marketing/landing-variants';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, parent }) => {
	const { marketingLocale } = await parent();
	const locale = (marketingLocale === 'en' ? 'en' : 'sv') satisfies MarketingLocale;
	const queryHero = url.searchParams.get('hero');
	const variant = resolveLandingVariant({
		queryHero,
		cookieVariant: cookies.get(LANDING_VARIANT_COOKIE),
		envVariant: publicEnv.PUBLIC_LANDING_VARIANT
	});

	if (queryHero && (queryHero === 'a' || queryHero === 'b')) {
		cookies.set(LANDING_VARIANT_COOKIE, variant, {
			path: '/',
			maxAge: 60 * 60 * 24 * 90,
			httpOnly: false,
			sameSite: 'lax'
		});
	}

	return {
		landingVariant: variant,
		hero: getLandingHeroCopy(variant, locale)
	};
};
