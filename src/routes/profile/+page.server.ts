import { fail } from '@sveltejs/kit';
import { updateProfileSchema, updateThemeSchema } from '$lib/validation/profile.schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user, themePreference } = await parent();
	const profile = await locals.profileService.getProfile(locals.user!.id);
	return {
		user,
		profile,
		themePreference: themePreference ?? 'system'
	};
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
	},
	updateTheme: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = updateThemeSchema.safeParse({
			themePreference: formData.get('themePreference')
		});

		if (!parsed.success) {
			return fail(400, {
				themeErrors: parsed.error.flatten().fieldErrors,
				themePreference: String(formData.get('themePreference') ?? 'system')
			});
		}

		const themePreference = await locals.profileService.setThemePreference(
			locals.user!.id,
			parsed.data.themePreference
		);

		return {
			themeSuccess: true as const,
			themePreference
		};
	}
};