import { z } from 'zod';

export const updateShoppingPushSchema = z.object({
	enabled: z.enum(['true', 'false'])
});
