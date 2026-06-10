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
