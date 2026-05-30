import { z } from 'zod';
import { THEME_PREFERENCES } from '$lib/domain/theme';
import { AVATAR_MAX_DATA_URL_LENGTH } from '$lib/utils/resize-image';

function isAllowedAvatarUrl(value: string): boolean {
	if (value === '') {
		return true;
	}
	if (/^https?:\/\//i.test(value)) {
		return true;
	}
	return /^data:image\/(png|jpe?g|gif|webp|heic|heif);base64,/i.test(value);
}

export const updateProfileSchema = z.object({
	displayName: z.string().max(80, 'Display name is too long').optional().or(z.literal('')),
	avatarUrl: z
		.string()
		.max(AVATAR_MAX_DATA_URL_LENGTH, 'profile.avatarTooLarge')
		.refine(isAllowedAvatarUrl, 'profile.avatarInvalidType')
		.optional()
		.or(z.literal(''))
});

export const updateThemeSchema = z.object({
	themePreference: z.enum(THEME_PREFERENCES)
});

export const avatarUrlSchema = z
	.string()
	.max(AVATAR_MAX_DATA_URL_LENGTH, 'profile.avatarTooLarge')
	.refine(isAllowedAvatarUrl, 'profile.avatarInvalidType');

export const saveAvatarSchema = z.object({
	avatarUrl: avatarUrlSchema.refine((value) => value.trim().length > 0, 'profile.avatarInvalidType')
});