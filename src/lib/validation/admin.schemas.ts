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

export const adminSetEmailSendingSchema = z.object({
	enabled: z.enum(['true', 'false'])
});

export const adminSetStripeCheckoutSchema = z.object({
	enabled: z.enum(['true', 'false'])
});

export const adminLogoutAllSchema = z.object({
	confirm: z.literal('yes')
});

export const adminPasswordResetSchema = adminUserIdSchema.extend({
	forceReset: z.enum(['true', 'false']).optional()
});

export const adminSetHouseholdPlanSchema = z.object({
	householdId: z.string().min(1),
	planTier: z.enum(['free', 'pro']),
	clearStripe: z.enum(['true', 'false']).optional()
});

export const adminCreateSocialPostSchema = z.object({
	body: z.string().min(1).max(3000),
	linkUrl: z.string().url().optional().nullable(),
	title: z.string().max(200).optional().nullable(),
	utmSource: z.string().max(100).optional().nullable(),
	utmMedium: z.string().max(100).optional().nullable(),
	utmCampaign: z.string().max(100).optional().nullable(),
	utmContent: z.string().max(100).optional().nullable(),
	source: z.enum(['agent', 'manual', 'automation']).optional()
});

export const adminUpdateSocialPostSchema = z.object({
	postId: z.string().min(1),
	title: z.string().max(200).optional().nullable(),
	body: z.string().min(1).max(3000).optional(),
	linkUrl: z.union([z.string().url(), z.literal('')]).optional().nullable(),
	utmSource: z.string().max(100).optional().nullable(),
	utmMedium: z.string().max(100).optional().nullable(),
	utmCampaign: z.string().max(100).optional().nullable(),
	utmContent: z.string().max(100).optional().nullable()
});

export const adminSocialPostIdSchema = z.object({
	postId: z.string().min(1)
});

export const adminGuideArticleIdSchema = z.object({
	guideId: z.string().min(1)
});

export const adminUpdateGuideArticleSchema = z.object({
	guideId: z.string().min(1),
	title: z.string().min(1).max(200).optional(),
	description: z.string().min(1).max(320).optional(),
	body: z.string().min(1).optional()
});
