import { fail } from '@sveltejs/kit';
import { updateProfileSchema } from '$lib/validation/profile.schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();
	const profile = await locals.profileService.getProfile(locals.user!.id);
	return { user, profile };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = updateProfileSchema.safeParse({
			displayName: formData.get('displayName'),
			avatarUrl: formData.get('avatarUrl')
		});

		if (!parsed.success) {
			return fail(400, {
				errors: parsed.error.flatten().fieldErrors,
				values: {
					displayName: String(formData.get('displayName') ?? ''),
					avatarUrl: String(formData.get('avatarUrl') ?? '')
				}
			});
		}

		const displayName = parsed.data.displayName?.trim() || null;
		const avatarUrl = parsed.data.avatarUrl?.trim() || null;

		const profile = await locals.profileService.updateProfile(locals.user!.id, {
			displayName,
			avatarUrl
		});

		return {
			success: true as const,
			profile
		};
	}
};
