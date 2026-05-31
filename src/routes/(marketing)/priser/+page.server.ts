import { fail } from '@sveltejs/kit';
import { joinWaitlistSchema } from '$lib/validation/waitlist.schemas';
import type { Actions } from './$types';

export const actions: Actions = {
	joinProWaitlist: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = joinWaitlistSchema.safeParse({
			email: formData.get('email'),
			source: formData.get('source')
		});

		if (!parsed.success) {
			return fail(400, {
				waitlistErrors: parsed.error.flatten().fieldErrors
			});
		}

		const result = await locals.waitlistService.join({
			email: parsed.data.email,
			userId: locals.user?.id ?? null,
			source: parsed.data.source
		});

		return {
			waitlistSuccess: true,
			waitlistAlreadySignedUp: result === 'exists'
		};
	}
};
