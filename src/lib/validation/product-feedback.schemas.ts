import { z } from 'zod';
import { CHURN_REASONS, PRODUCT_FEEDBACK_SOURCES } from '$lib/domain/product-feedback';

const churnReasonSchema = z
	.enum(['', ...CHURN_REASONS])
	.transform((value) => (value === '' ? null : value));

export const submitProductFeedbackSchema = z
	.object({
		source: z.enum(PRODUCT_FEEDBACK_SOURCES),
		churnReason: churnReasonSchema.optional(),
		message: z.string().trim().max(2000, 'Message too long')
	})
	.superRefine((data, ctx) => {
		const hasReason = data.churnReason != null;
		const hasMessage = data.message.length >= 3;

		if (data.source === 'settings' && !hasMessage) {
			ctx.addIssue({
				code: 'custom',
				path: ['message'],
				message: 'Message too short'
			});
		}

		if (data.source === 'post_onboarding' && !hasReason && !hasMessage) {
			ctx.addIssue({
				code: 'custom',
				path: ['churnReason'],
				message: 'Pick a reason or add a short note'
			});
		}
	});
