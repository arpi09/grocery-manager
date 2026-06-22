import { z } from 'zod';
import { MARKET_RATING_COMMENT_MAX_LENGTH } from '$lib/domain/market-lifecycle';

export const marketRateThreadSchema = z.object({
	stars: z.number().int().min(1).max(5),
	comment: z
		.string()
		.max(MARKET_RATING_COMMENT_MAX_LENGTH)
		.nullish()
		.transform((value) => {
			if (value == null) {
				return null;
			}
			const trimmed = value.trim();
			return trimmed.length > 0 ? trimmed : null;
		}),
	items_as_described: z.enum(['yes', 'partial', 'no']).nullish()
});

export type MarketRateThreadInput = z.infer<typeof marketRateThreadSchema>;
