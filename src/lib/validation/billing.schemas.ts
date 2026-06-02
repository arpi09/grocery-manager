import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
	interval: z.enum(['month', 'year'])
});
