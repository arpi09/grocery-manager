import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { pushSubscriptionRepository } from '$lib/server/di';
import { pushUnsubscribeSchema } from '$lib/validation/push.schemas';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = await request.json().catch(() => null);
	const parsed = pushUnsubscribeSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidRequest') },
			{ status: 400 }
		);
	}

	await pushSubscriptionRepository.removeByEndpoint(auth.user.id, parsed.data.endpoint);

	const remaining = await pushSubscriptionRepository.listByUserId(auth.user.id);
	if (remaining.length === 0) {
		await pushSubscriptionRepository.setPushEnabled(auth.user.id, false);
	}

	return json({ ok: true });
};
