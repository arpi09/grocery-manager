import { fail } from '@sveltejs/kit';
import { translate, type MessageKey } from '$lib/i18n/messages';
import { updateProfileSchema, updateThemeSchema, saveAvatarSchema } from '$lib/validation/profile.schemas';
import type { Actions, PageServerLoad } from './$types';

function translateFieldErrors(
	locale: App.Locals['locale'],
	errors: Record<string, string[] | undefined>
): Record<string, string[]> {
	const translated: Record<string, string[]> = {};

	for (const [field, messages] of Object.entries(errors)) {
		if (!messages?.length) {
			continue;
		}

		translated[field] = messages.map((message) =>
			message.startsWith('profile.') ? translate(locale, message as MessageKey) : message
		);
	}

	return translated;
}

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
				errors: translateFieldErrors(locals.locale, parsed.error.flatten().fieldErrors),
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
	saveAvatar: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = saveAvatarSchema.safeParse({
			avatarUrl: String(formData.get('avatarUrl') ?? '')
		});

		if (!parsed.success) {
			return fail(400, {
				avatarErrors: translateFieldErrors(locals.locale, parsed.error.flatten().fieldErrors),
				avatarAction: 'save' as const
			});
		}

		const avatarUrl = parsed.data.avatarUrl.trim();
		const current = await locals.profileService.getProfile(locals.user!.id);
		const profile = await locals.profileService.updateProfile(locals.user!.id, {
			displayName: current.displayName,
			avatarUrl
		});

		return {
			avatarSuccess: true as const,
			avatarUrl: profile.avatarUrl
		};
	},
	removeAvatar: async ({ locals }) => {
		const current = await locals.profileService.getProfile(locals.user!.id);
		const profile = await locals.profileService.updateProfile(locals.user!.id, {
			displayName: current.displayName,
			avatarUrl: null
		});

		return {
			avatarSuccess: true as const,
			avatarUrl: profile.avatarUrl
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