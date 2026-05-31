import { getVapidPublicKey } from '$lib/server/push';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const publicKey = getVapidPublicKey();
	if (!publicKey) {
		return json({ ok: false, error: 'Push not configured' }, { status: 503 });
	}
	return json({ ok: true, publicKey });
};
