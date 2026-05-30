import { z } from 'zod';
import { EXPIRY_REMINDER_DAY_OPTIONS } from '$lib/domain/expiry-reminder';

const daysSchema = z.enum(['3', '7']).refine((value) => EXPIRY_REMINDER_DAY_OPTIONS.includes(Number(value) as 3 | 7));

export const updateExpiryRemindersSchema = z.object({
	enabled: z.enum(['true', 'false']),
	days: daysSchema
});
