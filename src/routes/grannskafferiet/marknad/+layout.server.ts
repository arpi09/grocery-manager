import { isProTier } from '$lib/domain/plan';
import { isAdminRole } from '$lib/domain/user';
import { appSettingsService, marketChatService } from '$lib/server/di';
import { guardMarketV01PageLoad } from '$lib/server/market-v01-guard';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const base = await guardMarketV01PageLoad(event);
	const stripeCheckoutEnabled = await appSettingsService.isStripeCheckoutEnabled();

	let marketUnreadCount = 0;
	if (base.nearbyOptedIn) {
		const threads = await marketChatService.listThreads(base.user.id);
		if (threads.ok) {
			marketUnreadCount = threads.data.unreadCount;
		}
	}

	return {
		...base,
		isPro: isProTier(event.locals.planTier ?? 'free'),
		stripeCheckoutEnabled,
		isAdmin: isAdminRole(base.user.role),
		marketUnreadCount
	};
};
