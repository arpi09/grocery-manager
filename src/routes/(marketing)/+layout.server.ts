import { appLoginUrl, appRegisterUrl, marketingCanonicalUrl } from '$lib/marketing/app-url';
import { getMarketingContent, type MarketingLocale } from '$lib/marketing/content';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const locale = (locals.locale === 'en' ? 'en' : 'sv') satisfies MarketingLocale;
	const origin = url.origin;

	return {
		marketingLocale: locale,
		marketing: getMarketingContent(locale),
		loginUrl: appLoginUrl(origin),
		registerUrl: appRegisterUrl(origin),
		canonicalUrl: marketingCanonicalUrl(url.pathname, origin)
	};
};
