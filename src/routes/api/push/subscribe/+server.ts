import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { pushSubscriptionRepository } from '$lib/server/di';
import { pushSubscribeSchema } from '$lib/validation/push.schemas';
import { isPushConfigured } from '$lib/server/push';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}
	if (!isPushConfigured()) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.pushNotConfigured') },
			{ status: 503 }
		);
	}

	const body = await request.json().catch(() => null);
	const parsed = pushSubscribeSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidSubscription') },
			{ status: 400 }
		);
	}

	await pushSubscriptionRepository.upsert(auth.user.id, {
		endpoint: parsed.data.endpoint,
		p256dh: parsed.data.keys.p256dh,
		auth: parsed.data.keys.auth
	});
	await pushSubscriptionRepository.setPushEnabled(auth.user.id, true);

	return json({ ok: true });
};
