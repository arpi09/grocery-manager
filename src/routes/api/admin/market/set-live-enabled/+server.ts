import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/api-guards';
import { appSettingsService } from '$lib/server/di';
import { translate } from '$lib/i18n/messages';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = await request.json().catch(() => null);
	const enabled = body?.enabled;
	if (typeof enabled !== 'boolean') {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidPayload') },
			{ status: 400 }
		);
	}

	await appSettingsService.setMarketLiveEnabled(enabled);
	const status = await appSettingsService.getMarketLiveStatus();

	return json({
		ok: true,
		marketLive: status
	});
};
