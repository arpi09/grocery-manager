import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { nearbyPushService, pushSubscriptionRepository } from '$lib/server/di';
import { updateNearbyPushSchema } from '$lib/validation/nearby-push.schemas';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const settings = await nearbyPushService.getSettings(auth.user.id);
	return json({
		ok: true,
		enabled: settings.enabled,
		lastSentAt: settings.lastSentAt?.toISOString() ?? null
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = await request.json().catch(() => null);
	const parsed = updateNearbyPushSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidRequest') },
			{ status: 400 }
		);
	}

	const enabled = parsed.data.enabled === 'true';
	if (enabled) {
		const hasPush = await pushSubscriptionRepository.isPushEnabled(auth.user.id);
		if (!hasPush) {
			return json(
				{ ok: false, error: 'push_required' },
				{ status: 400 }
			);
		}
	}

	await nearbyPushService.updateSettings(auth.user.id, enabled);
	return json({ ok: true, enabled });
};
