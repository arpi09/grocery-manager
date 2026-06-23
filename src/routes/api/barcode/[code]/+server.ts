import { BarcodeLookupService, BarcodeNotFoundError } from '$lib/application/barcode-lookup.service';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { barcodeLookupService } from '$lib/server/di';
import { getSwedishProductOverride } from '$lib/infrastructure/barcode/swedish-product-overrides';
import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { recordProductEvent } from '$lib/server/product-events';
import type { RequestHandler } from './$types';

const lookupService: BarcodeLookupService = barcodeLookupService;

export const GET: RequestHandler = async ({ params, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		const result = await lookupService.lookupWithFallback(params.code, locals.locale);

		if (result.swedishOverrideUsed && result.found) {
			const normalized = params.code.replace(/\D/g, '');
			const override = getSwedishProductOverride(normalized);
			recordProductEvent(locals.pmfService, {
				userId: locals.user!.id,
				householdId: locals.householdId,
				eventType: 'barcode_override_used',
				metadata: {
					barcode: normalized,
					...(override?.store ? { store: override.store } : {})
				}
			});
		}

		return json({
			...result,
			normalizedKey: normalizeReceiptProductName(result.product.name)
		});
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
