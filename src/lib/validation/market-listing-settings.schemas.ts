import { z } from 'zod';
import { normalizeSwedishMobileNumber } from '$lib/domain/market-pricing';

const swishNumberSchema = z
	.string()
	.trim()
	.max(32)
	.refine((value) => value === '' || normalizeSwedishMobileNumber(value) != null, {
		message: 'invalid_swedish_mobile'
	})
	.transform((value) => (value === '' ? null : normalizeSwedishMobileNumber(value)));

export const updateMarketListingSettingsSchema = z
	.object({
		marketDefaultPricePercent: z.number().int().min(1).max(100).nullable().optional(),
		marketSwishNumber: swishNumberSchema.nullable().optional()
	})
	.refine(
		(value) =>
			value.marketDefaultPricePercent !== undefined || value.marketSwishNumber !== undefined,
		{ message: 'at_least_one_field_required' }
	);
