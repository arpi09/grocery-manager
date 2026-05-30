import { appLoginUrl, appRegisterUrl, marketingCanonicalUrl } from '$lib/marketing/app-url';
import { getMarketingContent, type MarketingLocale } from '$lib/marketing/content';
import { appendSearchParamsToAppPath, pickUtmSearchParams } from '$lib/marketing/utm-params';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const locale = (locals.locale === 'en' ? 'en' : 'sv') satisfies MarketingLocale;
	const origin = url.origin;
	const utm = pickUtmSearchParams(url.searchParams);

	return {
		marketingLocale: locale,
		marketing: getMarketingContent(locale),
		loginUrl: appendSearchParamsToAppPath(appLoginUrl(origin), utm),
		registerUrl: appendSearchParamsToAppPath(appRegisterUrl(origin), utm),
		canonicalUrl: marketingCanonicalUrl(url.pathname, origin)
	};
};
