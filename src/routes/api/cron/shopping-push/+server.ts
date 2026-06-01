import { json } from '@sveltejs/kit';
import { isCronAuthorized } from '$lib/server/cron-auth';
import { shoppingPushService } from '$lib/server/di';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	if (!isCronAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const result = await shoppingPushService.runDailyShoppingPush();
	return json({ ok: true, ...result });
};

export const GET: RequestHandler = POST;
