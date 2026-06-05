import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api-guards';
import { pushSubscriptionRepository } from '$lib/server/di';
import type { RequestHandler } from './$types';

/** Turn off push for this user on the server (all devices). Browser cleanup is client-side. */
export const POST: RequestHandler = async ({ locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	await pushSubscriptionRepository.removeAllForUser(auth.user.id);
	await pushSubscriptionRepository.setPushEnabled(auth.user.id, false);

	return json({ ok: true });
};
