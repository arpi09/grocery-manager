import { z } from 'zod';
import { THEME_PREFERENCES } from '$lib/domain/theme';

const MAX_AVATAR_URL_LENGTH = 150_000;

function isAllowedAvatarUrl(value: string): boolean {
	if (value === '') {
		return true;
	}
	if (/^https?:\/\//i.test(value)) {
		return true;
	}
	return /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value);
}

export const updateProfileSchema = z.object({
	displayName: z.string().max(80, 'Display name is too long').optional().or(z.literal('')),
	avatarUrl: z
		.string()
		.max(MAX_AVATAR_URL_LENGTH, 'Avatar image is too large')
		.refine(isAllowedAvatarUrl, 'Use an https URL or upload an image')
		.optional()
		.or(z.literal(''))
});

export const updateThemeSchema = z.object({
	themePreference: z.enum(THEME_PREFERENCES)
});