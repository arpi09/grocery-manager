import { isProTier } from '$lib/domain/plan';
import { appSettingsService } from '$lib/server/di';
import { guardMarketV01PageLoad } from '$lib/server/market-v01-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const base = await guardMarketV01PageLoad(event);
	const stripeCheckoutEnabled = await appSettingsService.isStripeCheckoutEnabled();

	return {
		...base,
		isPro: isProTier(event.locals.planTier ?? 'free'),
		stripeCheckoutEnabled
	};
};
