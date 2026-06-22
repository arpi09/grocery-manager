import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { marketChatService } from '$lib/server/di';
import { marketChatErrorResponse, requireMarketV01Backend } from '$lib/server/market-chat-api';
import { requireMarketV01UiAccessForApi } from '$lib/server/market-v01-guard';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const disabled = requireMarketV01Backend(locals.locale);
	if (disabled) {
		return disabled;
	}

	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const denied = await requireMarketV01UiAccessForApi(locals.locale, auth.user);
	if (denied) {
		return denied;
	}

	const body = await request.json().catch(() => null);
	const shareId = typeof body?.shareId === 'string' ? body.shareId.trim() : '';
	if (!shareId) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidPayload') },
			{ status: 400 }
		);
	}

	const result = await marketChatService.createOrGetThread({
		shareId,
		seekerUserId: auth.user.id,
		seekerHouseholdId: auth.householdId
	});

	if (!result.ok) {
		return marketChatErrorResponse(locals.locale, result.error);
	}

	return json({
		ok: true,
		thread: result.data.thread,
		messages: result.data.messages,
		created: result.data.created
	});
};
