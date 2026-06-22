import { error } from '@sveltejs/kit';
import { canAccessMarketV01Ui, MARKET_V01_PATH } from '$lib/domain/market-v01';
import { appSettingsService, expiringShareService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const preview = await expiringShareService.getSharePreview(params.token);
	if (!preview) {
		error(404, 'Not found');
	}

	const parentData = await parent();
	let showMarketCta = false;

	if (parentData.user) {
		const [nearby, marketLive] = await Promise.all([
			expiringShareService.getNearbySharingSettings(parentData.user.id),
			appSettingsService.getMarketLiveStatus()
		]);
		showMarketCta = canAccessMarketV01Ui(
			parentData.user,
			nearby.enabled,
			marketLive.enabledInApp
		);
	}

	return {
		preview,
		token: params.token,
		showMarketCta,
		marketPath: MARKET_V01_PATH
	};
};
