import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api-guards';
import { marketChatService } from '$lib/server/di';
import { marketChatErrorResponse, requireMarketV01Backend } from '$lib/server/market-chat-api';
import { requireMarketV01UiAccessForApi } from '$lib/server/market-v01-guard';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
	const disabled = requireMarketV01Backend(locals.locale);
	if (disabled) {
		return disabled;
	}

	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const denied = await requireMarketV01UiAccessForApi(locals.locale, auth.user);
	if (denied) {
		return denied;
	}

	const result = await marketChatService.confirmPickupAgreement({
		threadId: params.threadId,
		userId: auth.user.id,
		householdId: locals.householdId
	});

	if (!result.ok) {
		return marketChatErrorResponse(locals.locale, result.error);
	}

	return json({ ok: true, thread: result.data.thread });
};
