import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { seedDemoAccount } from '$lib/infrastructure/db/seed-demo';
import { isCronAuthorized } from '$lib/server/cron-auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	if (!isCronAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	if (!env.DEMO_ACCOUNT_PASSWORD?.trim()) {
		return json(
			{ ok: false, error: 'DEMO_ACCOUNT_PASSWORD is not configured' },
			{ status: 503 }
		);
	}

	try {
		const result = await seedDemoAccount();
		return json({ ok: true, email: result.email, householdId: 'household-demo-skaffu' });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[reset-demo] ${message}`);
		return json({ ok: false, error: message }, { status: 500 });
	}
};
