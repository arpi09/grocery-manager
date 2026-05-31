import { error, json } from '@sveltejs/kit';
import { pushSubscribeSchema } from '$lib/validation/push.schemas';
import { DrizzlePushSubscriptionRepository } from '$lib/infrastructure/repositories/push-subscription.repository';
import { isPushConfigured } from '$lib/server/push';
import type { RequestHandler } from './$types';

const pushRepository = new DrizzlePushSubscriptionRepository();

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}
	if (!isPushConfigured()) {
		return json({ ok: false, error: 'Push not configured' }, { status: 503 });
	}

	const body = await request.json().catch(() => null);
	const parsed = pushSubscribeSchema.safeParse(body);
	if (!parsed.success) {
		return json({ ok: false, error: 'Invalid subscription' }, { status: 400 });
	}

	await pushRepository.upsert(locals.user.id, {
		endpoint: parsed.data.endpoint,
		p256dh: parsed.data.keys.p256dh,
		auth: parsed.data.keys.auth
	});
	await pushRepository.setPushEnabled(locals.user.id, true);

	return json({ ok: true });
};
