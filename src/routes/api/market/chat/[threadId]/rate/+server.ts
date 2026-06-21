import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { marketChatService } from '$lib/server/di';
import { marketChatErrorResponse, requireMarketV01Backend } from '$lib/server/market-chat-api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const disabled = requireMarketV01Backend(locals.locale);
	if (disabled) {
		return disabled;
	}

	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = await request.json().catch(() => null);
	const stars = body?.stars;
	if (typeof stars !== 'number') {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidPayload') },
			{ status: 400 }
		);
	}

	const result = await marketChatService.rateThread({
		threadId: params.threadId,
		userId: auth.user.id,
		stars,
		householdId: locals.householdId
	});

	if (!result.ok) {
		return marketChatErrorResponse(locals.locale, result.error);
	}

	return json({ ok: true, ratingId: result.data.ratingId });
};
