import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api-guards';
import { userRepository } from '$lib/server/di';
import { requireMarketV01UiAccessForApi } from '$lib/server/market-v01-guard';
import { translate } from '$lib/i18n/messages';
import { updateMarketListingSettingsSchema } from '$lib/validation/market-listing-settings.schemas';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const denied = await requireMarketV01UiAccessForApi(locals.locale, auth.user);
	if (denied) {
		return denied;
	}

	const settings = await userRepository.getMarketListingSettings(auth.user.id);
	return json({ ok: true, ...settings });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const denied = await requireMarketV01UiAccessForApi(locals.locale, auth.user);
	if (denied) {
		return denied;
	}

	const body = await request.json().catch(() => null);
	const parsed = updateMarketListingSettingsSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidRequest') },
			{ status: 400 }
		);
	}

	const updated = await userRepository.updateMarketListingSettings(auth.user.id, parsed.data);
	if (!updated) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidRequest') },
			{ status: 400 }
		);
	}

	return json({ ok: true, ...updated });
};
