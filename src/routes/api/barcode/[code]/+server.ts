import { BarcodeLookupService, BarcodeNotFoundError } from '$lib/application/barcode-lookup.service';
import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import type { RequestHandler } from './$types';

const lookupService = new BarcodeLookupService();

export const GET: RequestHandler = async ({ params, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		const result = await lookupService.lookupWithFallback(params.code, locals.locale);
		return json(result);
	} catch (e) {
		if (e instanceof BarcodeNotFoundError) {
			return json(
				{ error: translate(locals.locale, 'errors.api.barcodeNotFound') },
				{ status: 400 }
			);
		}
		throw e;
	}
};
