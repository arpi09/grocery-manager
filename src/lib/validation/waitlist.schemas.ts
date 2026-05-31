import { z } from 'zod';
import { WAITLIST_SOURCES } from '$lib/domain/waitlist';

export const joinWaitlistSchema = z.object({
	email: z.string().trim().email('Enter a valid email'),
	source: z.enum(WAITLIST_SOURCES)
});
