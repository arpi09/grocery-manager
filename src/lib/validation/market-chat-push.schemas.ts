import { z } from 'zod';

export const updateMarketChatPushSchema = z.object({
	enabled: z.enum(['true', 'false'])
});
