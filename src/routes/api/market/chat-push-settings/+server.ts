import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { marketChatPushService, pushSubscriptionRepository } from '$lib/server/di';
import { requireMarketV01Backend } from '$lib/server/market-chat-api';
import { requireMarketV01UiAccessForApi } from '$lib/server/market-v01-guard';
import { updateMarketChatPushSchema } from '$lib/validation/market-chat-push.schemas';
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

	const denied = await requireMarketV01UiAccessForApi(locals.locale, auth.user);
	if (denied) {
		return denied;
	}

	const settings = await marketChatPushService.getSettings(auth.user.id);
	const pushNotificationsEnabled = await pushSubscriptionRepository.isPushEnabled(auth.user.id);

	return json({
		ok: true,
		enabled: settings.enabled,
		pushNotificationsEnabled
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
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
	const parsed = updateMarketChatPushSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidRequest') },
			{ status: 400 }
		);
	}

	const enabled = parsed.data.enabled === 'true';
	if (enabled) {
		const hasPush = await pushSubscriptionRepository.isPushEnabled(auth.user.id);
		if (!hasPush) {
			return json({ ok: false, error: 'push_required' }, { status: 400 });
		}
	}

	await marketChatPushService.updateSettings(auth.user.id, enabled);
	return json({ ok: true, enabled });
};
