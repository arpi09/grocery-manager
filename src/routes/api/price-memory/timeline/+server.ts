import { json } from '@sveltejs/kit';
import type { MatchedLevel } from '$lib/domain/price-memory';
import { requireHousehold } from '$lib/server/api-guards';
import { emitPriceMemoryTimelineViewed } from '$lib/server/price-memory-telemetry';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const key = url.searchParams.get('key')?.trim() ?? '';
	const conceptKey = url.searchParams.get('conceptKey')?.trim() ?? '';
	const entryPoint = url.searchParams.get('entryPoint');

	let timeline: Awaited<ReturnType<typeof locals.priceMemoryService.getTimelineByKey>> = [];
	let matchedLevel: MatchedLevel = 'raw';

	if (conceptKey) {
		timeline = await locals.priceMemoryService.getTimelineByConceptKey(auth.householdId, conceptKey);
		matchedLevel = 'household_concept';
	} else if (key) {
		timeline = await locals.priceMemoryService.getTimelineByKey(auth.householdId, key);
		matchedLevel = 'normalized_product';
	} else {
		return json({ ok: false, error: 'Missing lookup parameter' }, { status: 400 });
	}

	emitPriceMemoryTimelineViewed(locals.pmfService, {
		userId: auth.user.id,
		householdId: auth.householdId,
		matchedLevel,
		entryCount: timeline.length,
		entryPoint
	});

	return json({ ok: true, timeline });
};
