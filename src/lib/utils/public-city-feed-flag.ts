import { env } from '$env/dynamic/public';

/** Client-safe kill switch for grannskafferiet / public city feed (Tier C). */
export function isPublicCityFeedEnabled(): boolean {
	return env.PUBLIC_CITY_FEED_ENABLED === 'true';
}
