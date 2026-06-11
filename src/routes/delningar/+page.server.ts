import { error } from '@sveltejs/kit';
import { buildAcquisitionRegisterUrl } from '$lib/marketing/acquisition-attribution';
import { isPublicCityFeedEnabled } from '$lib/application/public-city-feed.service';
import { publicCityFeedService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, request }) => {
	if (!isPublicCityFeedEnabled()) {
		error(404, 'Not found');
	}

	const stad = url.searchParams.get('stad');
	const requestOrigin = new URL(request.url).origin;
	const feed = await publicCityFeedService.getCityFeed(stad);

	return {
		feed,
		registerUrl: buildAcquisitionRegisterUrl('city_feed', requestOrigin)
	};
};
