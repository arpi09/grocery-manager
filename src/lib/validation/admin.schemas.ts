import { z } from 'zod';
import { USER_ROLES } from '$lib/domain/user';

export const adminUserIdSchema = z.object({
	userId: z.string().min(1)
});

export const adminSetRoleSchema = adminUserIdSchema.extend({
	role: z.enum(USER_ROLES)
});

export const adminSetPetsSchema = adminUserIdSchema.extend({
	enabled: z.enum(['true', 'false'])
});

export const adminLogoutAllSchema = z.object({
	confirm: z.literal('yes')
});
