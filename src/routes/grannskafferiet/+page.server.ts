import { redirect } from '@sveltejs/kit';
import { isProTier } from '$lib/domain/plan';
import { appSettingsService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url, locals }) => {
	const { user } = await parent();
	if (!user) {
		redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	const stripeCheckoutEnabled = await appSettingsService.isStripeCheckoutEnabled();

	return {
		user,
		isPro: isProTier(locals.planTier ?? 'free'),
		stripeCheckoutEnabled
	};
};
