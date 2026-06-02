import { z } from 'zod';

export const consumeItemSchema = z
	.object({
		consumptionPreset: z.enum(['lite', 'half', 'all']).optional(),
		consumptionAmount: z.string().max(20).optional()
	})
	.transform((data) => ({
		preset: data.consumptionPreset,
		customAmount: data.consumptionAmount?.trim() || undefined
	}));
