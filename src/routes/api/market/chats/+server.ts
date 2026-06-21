import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api-guards';
import { marketChatService } from '$lib/server/di';
import { marketChatErrorResponse, requireMarketV01Backend } from '$lib/server/market-chat-api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const disabled = requireMarketV01Backend(locals.locale);
	if (disabled) {
		return disabled;
	}

	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const result = await marketChatService.listThreads(auth.user.id);
	if (!result.ok) {
		return marketChatErrorResponse(locals.locale, result.error);
	}
	return json({ ok: true, threads: result.data.threads });
};
