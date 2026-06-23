import { json } from '@sveltejs/kit';
import { isCronAuthorized } from '$lib/server/cron-auth';
import { brainProactivePushService } from '$lib/server/di';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	if (!isCronAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const result = await brainProactivePushService.runWeeklyHouseholdBriefing();
	return json({ ok: true, ...result });
};
