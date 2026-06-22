import { z } from 'zod';

export const updateMarketProfileSchema = z.object({
	marketFirstName: z.string().trim().min(1).max(40)
});

export const marketChatReportSchema = z.object({
	reason: z.enum(['inappropriate', 'no_show', 'misleading', 'unsafe', 'other']),
	blockCounterpart: z.boolean().optional()
});
