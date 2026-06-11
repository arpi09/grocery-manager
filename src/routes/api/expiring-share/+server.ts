import { json } from '@sveltejs/kit';
import { isValidLatitude, isValidLongitude } from '$lib/domain/geo';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { expiringShareService, nearbyPushService } from '$lib/server/di';
import { recordAppError } from '$lib/server/error-log/record';
import { recordProductEvent } from '$lib/server/product-events';
import { createExpiringShareWithGeoSchema } from '$lib/validation/nearby-sharing.schemas';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	if (!locals.householdId) {
		return json({ ok: false, error: translate(locals.locale, 'errors.api.unauthorized') }, { status: 400 });
	}

	const body = await request.json().catch(() => ({}));
	const parsed = createExpiringShareWithGeoSchema.safeParse(body);
	const attachNearby = parsed.success ? parsed.data.attachNearby === true : false;
	const coordinate =
		parsed.success &&
		parsed.data.latitude != null &&
		parsed.data.longitude != null &&
		isValidLatitude(parsed.data.latitude) &&
		isValidLongitude(parsed.data.longitude)
			? { latitude: parsed.data.latitude, longitude: parsed.data.longitude }
			: null;

	const inventory = await locals.inventoryService.listAll(locals.householdId);
	const share = await expiringShareService.createShareLink(
		locals.householdId,
		locals.user!.id,
		inventory,
		{
			attachNearby,
			coordinate,
			sharerPlanTier: locals.planTier,
			sharerRole: locals.user!.role
		}
	);

	if (!share) {
		return json(
			{ ok: false, error: translate(locals.locale, 'expiringShare.noItems') },
			{ status: 400 }
		);
	}

	if (attachNearby) {
		void nearbyPushService.notifyNearbyViewers(share.shareId).catch((error) => {
			void recordAppError({ error, path: '/api/expiring-share (nearby-push)', userId: locals.user?.id });
		});
	}

	recordProductEvent(locals.pmfService, {
		userId: locals.user!.id,
		householdId: locals.householdId,
		eventType: 'expiring_share_created',
		metadata: { itemCount: share.itemCount }
	});

	return json({
		ok: true,
		url: `${url.origin}${share.urlPath}`,
		expiresAt: share.expiresAt.toISOString(),
		itemCount: share.itemCount
	});
};
