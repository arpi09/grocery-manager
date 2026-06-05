import { fail } from '@sveltejs/kit';
import { submitProductFeedbackSchema } from '$lib/validation/product-feedback.schemas';
import { joinWaitlistSchema } from '$lib/validation/waitlist.schemas';
import type { RequestEvent } from '@sveltejs/kit';

export const billingActions = {
	submitProductFeedback: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const parsed = submitProductFeedbackSchema.safeParse({
			source: formData.get('source'),
			churnReason: formData.get('churnReason'),
			message: formData.get('message') ?? ''
		});

		if (!parsed.success) {
			return fail(400, { feedbackErrors: parsed.error.flatten().fieldErrors });
		}

		await locals.productFeedbackService.submit({
			userId: locals.user!.id,
			householdId: locals.householdId,
			source: parsed.data.source,
			churnReason: parsed.data.churnReason ?? null,
			message: parsed.data.message
		});

		return { feedbackSuccess: true };
	},
	joinProWaitlist: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const emailFromForm = formData.get('email');
		const parsed = joinWaitlistSchema.safeParse({
			email: typeof emailFromForm === 'string' && emailFromForm.trim()
				? emailFromForm
				: locals.user!.email,
			source: 'settings'
		});

		if (!parsed.success) {
			return fail(400, { waitlistErrors: parsed.error.flatten().fieldErrors });
		}

		const result = await locals.waitlistService.join({
			email: parsed.data.email,
			userId: locals.user!.id,
			source: parsed.data.source
		});

		return {
			waitlistSuccess: true,
			waitlistAlreadySignedUp: result === 'exists'
		};
	}
};
