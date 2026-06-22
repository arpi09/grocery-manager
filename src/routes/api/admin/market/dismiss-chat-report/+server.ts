import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireAdmin } from '$lib/server/api-guards';
import { marketChatService } from '$lib/server/di';
import { marketChatErrorResponse } from '$lib/server/market-chat-api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = await request.json().catch(() => null);
	const reportId = typeof body?.reportId === 'string' ? body.reportId.trim() : '';
	if (!reportId) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidPayload') },
			{ status: 400 }
		);
	}

	const result = await marketChatService.dismissChatReport(reportId);
	if (!result.ok) {
		return marketChatErrorResponse(locals.locale, result.error);
	}

	return json({ ok: true });
};
