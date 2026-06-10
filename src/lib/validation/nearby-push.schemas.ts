import { z } from 'zod';

export const updateNearbyPushSchema = z.object({
	enabled: z.enum(['true', 'false'])
});
