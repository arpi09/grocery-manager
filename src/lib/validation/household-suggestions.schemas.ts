import { LOCATIONS } from '$lib/domain/location';
import { z } from 'zod';

export const resetShelfLifeSuggestionSchema = z.object({
	normalizedKey: z.string().trim().min(1),
	location: z.enum(LOCATIONS)
});

export const resetLocationSuggestionSchema = z.object({
	normalizedKey: z.string().trim().min(1)
});
