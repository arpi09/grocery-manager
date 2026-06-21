import { json } from '@sveltejs/kit';
import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import { isMarketV01BackendEnabled } from '$lib/domain/market-v01';
import type { MarketChatErrorCode } from '$lib/application/market-chat.service';

const ERROR_STATUS: Record<MarketChatErrorCode, number> = {
	not_found: 404,
	forbidden: 403,
	blocked: 403,
	rate_limited: 429,
	validation: 400,
	conflict: 409,
	closed: 409
};

const ERROR_MESSAGE_KEY: Record<MarketChatErrorCode, Parameters<typeof translate>[1]> = {
	not_found: 'errors.api.invalidRequest',
	forbidden: 'errors.api.unauthorized',
	blocked: 'nearbySharing.reportNotFound',
	rate_limited: 'errors.api.rateLimited',
	validation: 'errors.api.invalidPayload',
	conflict: 'errors.api.invalidRequest',
	closed: 'errors.api.invalidRequest'
};

export function requireMarketV01Backend(locale: Locale): Response | null {
	if (!isMarketV01BackendEnabled()) {
		return json({ ok: false, error: translate(locale, 'errors.api.invalidRequest') }, { status: 404 });
	}
	return null;
}

export function marketChatErrorResponse(locale: Locale, code: MarketChatErrorCode): Response {
	return json(
		{ ok: false, error: translate(locale, ERROR_MESSAGE_KEY[code]) },
		{ status: ERROR_STATUS[code] }
	);
}
