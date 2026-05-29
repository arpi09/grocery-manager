import { BarcodeLookupService, BarcodeNotFoundError } from '$lib/application/barcode-lookup.service';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const lookupService = new BarcodeLookupService();

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	try {
		const result = await lookupService.lookupWithFallback(params.code);
		return json(result);
	} catch (e) {
		if (e instanceof BarcodeNotFoundError) {
			error(400, 'Invalid barcode');
		}
		throw e;
	}
};
