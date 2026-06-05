import { json } from '@sveltejs/kit';
import { submitPmfSurveySchema } from '$lib/validation/pmf-survey.schemas';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = submitPmfSurveySchema.safeParse(body);
	if (!parsed.success) {
		return json({ ok: false, error: 'Invalid payload' }, { status: 400 });
	}

	const id = await locals.pmfSurveyService.submit({
		userId: locals.user.id,
		householdId: locals.householdId,
		trigger: parsed.data.trigger,
		npsScore: parsed.data.npsScore,
		wouldMiss: parsed.data.wouldMiss,
		comment: parsed.data.comment
	});

	return json({ ok: true, id });
};
