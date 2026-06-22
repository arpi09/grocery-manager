import { json } from '@sveltejs/kit';
import { marketFirstName } from '$lib/domain/market-profile';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { profileService } from '$lib/server/di';
import { requireMarketV01UiAccessForApi } from '$lib/server/market-v01-guard';
import { requireMarketV01Backend } from '$lib/server/market-chat-api';
import { updateMarketProfileSchema } from '$lib/validation/market-profile.schemas';
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

	const profile = await profileService.getProfile(auth.user.id);
	return json({
		ok: true,
		profile: {
			marketFirstName: profile.marketFirstName,
			displayFirstName: marketFirstName(profile),
			avatarUrl: profile.avatarUrl
		}
	});
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
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
	const parsed = updateMarketProfileSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidPayload') },
			{ status: 400 }
		);
	}

	const profile = await profileService.updateMarketProfile(
		auth.user.id,
		parsed.data.marketFirstName
	);

	return json({
		ok: true,
		profile: {
			marketFirstName: profile.marketFirstName,
			displayFirstName: marketFirstName(profile),
			avatarUrl: profile.avatarUrl
		}
	});
};
