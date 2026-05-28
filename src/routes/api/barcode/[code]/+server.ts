import { BarcodeLookupService, BarcodeNotFoundError } from '$lib/application/barcode-lookup.service';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const lookupService = new BarcodeLookupService();

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	try {
		const product = await lookupService.lookup(params.code);
		return json(product);
	} catch (e) {
		if (e instanceof BarcodeNotFoundError) {
			error(404, 'Product not found');
		}
		throw e;
	}
};
