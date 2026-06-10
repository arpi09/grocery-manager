import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { expiringShareService } from '$lib/server/di';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	if (!locals.householdId) {
		return json({ ok: false, error: translate(locals.locale, 'errors.api.unauthorized') }, { status: 400 });
	}

	const result = await expiringShareService.listNearbyShares(auth.user.id, locals.householdId, {
		viewerPlanTier: locals.planTier,
		viewerRole: auth.user.role
	});

	return json({
		ok: true,
		optedIn: result.optedIn,
		radiusM: result.radiusM,
		shares: result.shares.map((share) => ({
			id: share.id,
			itemCount: share.itemCount,
			previewItems: share.previewItems,
			approximateDistanceM: share.approximateDistanceM,
			mapLat: share.mapLat,
			mapLng: share.mapLng,
			openPath: share.openPath,
			expiresAt: share.expiresAt.toISOString(),
			createdAt: share.createdAt.toISOString()
		}))
	});
};
