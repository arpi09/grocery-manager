import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { submitPmfSurveySchema } from '$lib/validation/pmf-survey.schemas';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidJson') },
			{ status: 400 }
		);
	}

	const parsed = submitPmfSurveySchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidPayload') },
			{ status: 400 }
		);
	}

	const id = await locals.pmfSurveyService.submit({
		userId: auth.user.id,
		householdId: locals.householdId,
		trigger: parsed.data.trigger,
		npsScore: parsed.data.npsScore,
		wouldMiss: parsed.data.wouldMiss,
		comment: parsed.data.comment
	});

	return json({ ok: true, id });
};
