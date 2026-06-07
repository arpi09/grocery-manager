import { json } from '@sveltejs/kit';
import { getOpenAiApiKey } from '$lib/server/openai';
import { isHealthAuthorized } from '$lib/server/health-auth';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	if (!isHealthAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const configured = getOpenAiApiKey() !== null;
	return json({ ok: configured, configured }, { status: configured ? 200 : 503 });
};
