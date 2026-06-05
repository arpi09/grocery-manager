import { getVapidPublicKey } from '$lib/server/push';
import { translate } from '$lib/i18n/messages';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const publicKey = getVapidPublicKey();
	if (!publicKey) {
		return json(
			{ ok: false, error: translate(locals?.locale ?? 'sv', 'errors.api.pushNotConfigured') },
			{ status: 503 }
		);
	}
	return json({ ok: true, publicKey });
};
