import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api-guards';
import { expiringShareService, marketListingService, userRepository } from '$lib/server/di';
import { requireMarketV01UiAccessForApi } from '$lib/server/market-v01-guard';
import { translate } from '$lib/i18n/messages';
import { updateAutoListingSettingsSchema } from '$lib/validation/nearby-sharing.schemas';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const denied = await requireMarketV01UiAccessForApi(locals.locale, auth.user);
	if (denied) {
		return denied;
	}

	const enabled = await userRepository.getAutoNearbyListingEnabled(auth.user.id);
	return json({ ok: true, enabled });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const denied = await requireMarketV01UiAccessForApi(locals.locale, auth.user);
	if (denied) {
		return denied;
	}

	const nearby = await expiringShareService.getNearbySharingSettings(auth.user.id);
	const body = await request.json().catch(() => null);
	const parsed = updateAutoListingSettingsSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidRequest') },
			{ status: 400 }
		);
	}

	if (parsed.data.enabled && !nearby.enabled) {
		return json(
			{ ok: false, error: translate(locals.locale, 'marketV01.autoListingRequiresNearby') },
			{ status: 400 }
		);
	}

	const updated = await userRepository.updateAutoNearbyListingEnabled(
		auth.user.id,
		parsed.data.enabled
	);
	if (!updated) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidRequest') },
			{ status: 400 }
		);
	}

	let refresh = null;
	if (parsed.data.enabled) {
		if (locals.householdId) {
			await marketListingService.refreshAutoNearbyListing(locals.householdId, auth.user.id, {
				userRole: auth.user.role
			});
		} else {
			refresh = await marketListingService.refreshAutoNearbyListingForUser(auth.user.id, {
				userRole: auth.user.role
			});
		}
	} else {
		refresh = await marketListingService.clearAutoListingsForUser(auth.user.id);
	}

	return json({
		ok: true,
		enabled: parsed.data.enabled,
		refresh
	});
};
