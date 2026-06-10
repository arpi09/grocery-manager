import { z } from 'zod';

const coordinateSchema = z.number().finite();

export const updateNearbySharingSettingsSchema = z.object({
	enabled: z.boolean(),
	latitude: coordinateSchema.optional(),
	longitude: coordinateSchema.optional()
});

export const createExpiringShareWithGeoSchema = z.object({
	attachNearby: z.boolean().optional(),
	latitude: coordinateSchema.optional(),
	longitude: coordinateSchema.optional()
});

export const expiringShareReportSchema = z
	.object({
		shareId: z.string().trim().min(1).optional(),
		token: z.string().trim().min(1).optional(),
		blockHousehold: z.boolean().optional(),
		reason: z.enum(['inappropriate', 'spam', 'safety', 'other']).optional()
	})
	.refine((value) => Boolean(value.shareId || value.token), {
		message: 'shareId or token required'
	});
