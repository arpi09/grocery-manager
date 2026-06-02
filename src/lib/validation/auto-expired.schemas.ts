import { z } from 'zod';
import { AUTO_EXPIRED_GRACE_DAY_OPTIONS } from '$lib/domain/auto-expired';

const graceDaysSchema = z
	.enum(['3', '7', '14'])
	.refine((value) =>
		AUTO_EXPIRED_GRACE_DAY_OPTIONS.includes(Number(value) as (typeof AUTO_EXPIRED_GRACE_DAY_OPTIONS)[number])
	);

export const updateAutoExpiredGraceSchema = z.object({
	days: graceDaysSchema
});
