import { error, json } from '@sveltejs/kit';
import { pushUnsubscribeSchema } from '$lib/validation/push.schemas';
import { DrizzlePushSubscriptionRepository } from '$lib/infrastructure/repositories/push-subscription.repository';
import type { RequestHandler } from './$types';

const pushRepository = new DrizzlePushSubscriptionRepository();

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const body = await request.json().catch(() => null);
	const parsed = pushUnsubscribeSchema.safeParse(body);
	if (!parsed.success) {
		return json({ ok: false, error: 'Invalid request' }, { status: 400 });
	}

	await pushRepository.removeByEndpoint(locals.user.id, parsed.data.endpoint);

	const remaining = await pushRepository.listByUserId(locals.user.id);
	if (remaining.length === 0) {
		await pushRepository.setPushEnabled(locals.user.id, false);
	}

	return json({ ok: true });
};
