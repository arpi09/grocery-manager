import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { marketChatService } from '$lib/server/di';
import { marketChatErrorResponse, requireMarketV01Backend } from '$lib/server/market-chat-api';
import { requireMarketV01UiAccessForApi } from '$lib/server/market-v01-guard';
import { marketRateThreadSchema } from '$lib/validation/market-rating.schemas';
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

	const denied = await requireMarketV01UiAccessForApi(locals.locale, auth.user);
	if (denied) {
		return denied;
	}

	const body = await request.json().catch(() => null);
	const parsed = marketRateThreadSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidPayload') },
			{ status: 400 }
		);
	}

	const result = await marketChatService.rateThread({
		threadId: params.threadId,
		userId: auth.user.id,
		stars: parsed.data.stars,
		comment: parsed.data.comment,
		itemsAsDescribed: parsed.data.items_as_described ?? null,
		householdId: locals.householdId
	});

	if (!result.ok) {
		return marketChatErrorResponse(locals.locale, result.error);
	}

	return json({
		ok: true,
		ratingId: result.data.ratingId,
		counterpartRating: result.data.counterpartRating
	});
};
