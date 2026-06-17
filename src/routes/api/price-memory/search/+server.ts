import { json } from '@sveltejs/kit';
import { requireHousehold } from '$lib/server/api-guards';
import { emitPriceMemorySearch } from '$lib/server/price-memory-telemetry';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const query = url.searchParams.get('q')?.trim() ?? '';
	if (!query) {
		return json({ ok: false, error: 'Missing query' }, { status: 400 });
	}

	const limitRaw = url.searchParams.get('limit');
	const limit =
		limitRaw && Number.isFinite(Number(limitRaw)) ? Math.min(Math.max(Number(limitRaw), 1), 25) : 10;
	const entryPoint = url.searchParams.get('entryPoint');

	const results = await locals.priceMemoryService.search(auth.householdId, query, limit);

	emitPriceMemorySearch(locals.pmfService, {
		userId: auth.user.id,
		householdId: auth.householdId,
		queryLength: query.length,
		resultCount: results.length,
		entryPoint
	});

	return json({ ok: true, results });
};
