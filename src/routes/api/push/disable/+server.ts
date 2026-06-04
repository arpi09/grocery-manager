import { error, json } from '@sveltejs/kit';
import { DrizzlePushSubscriptionRepository } from '$lib/infrastructure/repositories/push-subscription.repository';
import type { RequestHandler } from './$types';

const pushRepository = new DrizzlePushSubscriptionRepository();

/** Turn off push for this user on the server (all devices). Browser cleanup is client-side. */
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	await pushRepository.removeAllForUser(locals.user.id);
	await pushRepository.setPushEnabled(locals.user.id, false);

	return json({ ok: true });
};
