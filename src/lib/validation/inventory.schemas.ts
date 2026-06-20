import { z } from 'zod';
import { LOCATIONS } from '$lib/domain/location';

export const itemSchema = z.object({
	name: z.string().min(1, 'Name is required').max(120),
	location: z.enum(LOCATIONS),
	quantity: z
		.string()
		.min(1)
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Quantity must be positive'),
	unit: z.string().max(20).optional().or(z.literal('')),
	expiresOn: z.string().optional().or(z.literal('')),
	notes: z.string().max(500).optional().or(z.literal('')),
	barcode: z
		.string()
		.regex(/^\d{8,}$/, 'Barcode must be at least 8 digits')
		.optional()
		.or(z.literal(''))
});

export type ItemFormData = z.infer<typeof itemSchema>;
