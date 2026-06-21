import { error, redirect } from '@sveltejs/kit';
import { canAccessMarketV01Ui, isMarketV01BackendEnabled } from '$lib/domain/market-v01';
import { expiringShareService, userRepository } from '$lib/server/di';
import type { ServerLoadEvent } from '@sveltejs/kit';

export async function guardMarketV01PageLoad(event: ServerLoadEvent) {
	if (!isMarketV01BackendEnabled()) {
		error(404);
	}

	const { user } = await event.parent();
	if (!user) {
		redirect(303, `/login?redirect=${encodeURIComponent(event.url.pathname)}`);
	}

	const nearby = await expiringShareService.getNearbySharingSettings(user.id);
	if (!canAccessMarketV01Ui(user, nearby.enabled)) {
		error(404);
	}

	const autoNearbyListingEnabled = await userRepository.getAutoNearbyListingEnabled(user.id);

	return {
		user,
		nearbyOptedIn: nearby.enabled,
		autoNearbyListingEnabled
	};
}
