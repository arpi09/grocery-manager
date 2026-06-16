import { expiringShareService, pushSubscriptionRepository, nearbyPushService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const [nearbyPushSettings, pushNotificationsEnabled, nearbySharingSettings] = await Promise.all([
		user
			? nearbyPushService.getSettings(user.id)
			: Promise.resolve({ enabled: false, lastSentAt: null }),
		user ? pushSubscriptionRepository.isPushEnabled(user.id) : Promise.resolve(false),
		user
			? expiringShareService.getNearbySharingSettings(user.id)
			: Promise.resolve({ enabled: false, latitude: null, longitude: null, updatedAt: null })
	]);

	return {
		nearbyPushEnabled: nearbyPushSettings.enabled,
		pushNotificationsEnabled,
		nearbySharingEnabled: nearbySharingSettings.enabled
	};
};
