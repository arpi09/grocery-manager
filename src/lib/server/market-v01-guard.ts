import { error, json, redirect } from '@sveltejs/kit';
import { canAccessMarketV01Ui, isMarketV01BackendEnabled } from '$lib/domain/market-v01';
import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import { appSettingsService, expiringShareService, userRepository } from '$lib/server/di';
import type { ServerLoadEvent } from '@sveltejs/kit';

export async function guardMarketV01PageLoad(event: ServerLoadEvent) {
	if (!isMarketV01BackendEnabled()) {
		error(404);
	}

	const { user } = await event.parent();
	if (!user) {
		redirect(303, `/login?redirect=${encodeURIComponent(event.url.pathname)}`);
	}

	const [nearby, marketLive] = await Promise.all([
		expiringShareService.getNearbySharingSettings(user.id),
		appSettingsService.getMarketLiveStatus()
	]);

	if (!canAccessMarketV01Ui(user, nearby.enabled, marketLive.enabledInApp)) {
		error(404);
	}

	const autoNearbyListingEnabled = await userRepository.getAutoNearbyListingEnabled(user.id);

	return {
		user,
		nearbyOptedIn: nearby.enabled,
		autoNearbyListingEnabled,
		marketLiveEnabled: marketLive.enabledInApp
	};
}

export async function requireMarketV01UiAccessForApi(
	locale: Locale,
	user: { id: string; role?: string | null }
): Promise<Response | null> {
	if (!isMarketV01BackendEnabled()) {
		return json({ ok: false, error: translate(locale, 'errors.api.invalidRequest') }, { status: 404 });
	}

	const [nearby, marketLive] = await Promise.all([
		expiringShareService.getNearbySharingSettings(user.id),
		appSettingsService.getMarketLiveStatus()
	]);

	if (!canAccessMarketV01Ui(user, nearby.enabled, marketLive.enabledInApp)) {
		return json({ ok: false, error: translate(locale, 'errors.api.unauthorized') }, { status: 404 });
	}

	return null;
}
