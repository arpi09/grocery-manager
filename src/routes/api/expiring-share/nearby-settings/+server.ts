import { json } from '@sveltejs/kit';
import { isValidLatitude, isValidLongitude } from '$lib/domain/geo';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { expiringShareService } from '$lib/server/di';
import { updateNearbySharingSettingsSchema } from '$lib/validation/nearby-sharing.schemas';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const settings = await expiringShareService.getNearbySharingSettings(auth.user.id);
	return json({
		ok: true,
		enabled: settings.enabled,
		latitude: settings.latitude,
		longitude: settings.longitude,
		updatedAt: settings.updatedAt?.toISOString() ?? null
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = await request.json().catch(() => null);
	const parsed = updateNearbySharingSettingsSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidRequest') },
			{ status: 400 }
		);
	}

	if (parsed.data.enabled) {
		const hasCoords =
			parsed.data.latitude != null &&
			parsed.data.longitude != null &&
			isValidLatitude(parsed.data.latitude) &&
			isValidLongitude(parsed.data.longitude);
		if (!hasCoords) {
			const existing = await expiringShareService.getNearbySharingSettings(auth.user.id);
			if (existing.latitude == null || existing.longitude == null) {
				return json(
					{ ok: false, error: translate(locals.locale, 'nearbySharing.locationRequired') },
					{ status: 400 }
				);
			}
		}
	}

	const settings = await expiringShareService.updateNearbySharingSettings(auth.user.id, {
		enabled: parsed.data.enabled,
		coordinate:
			parsed.data.latitude != null && parsed.data.longitude != null
				? { latitude: parsed.data.latitude, longitude: parsed.data.longitude }
				: null
	});

	return json({
		ok: true,
		enabled: settings.enabled,
		latitude: settings.latitude,
		longitude: settings.longitude,
		updatedAt: settings.updatedAt?.toISOString() ?? null
	});
};
