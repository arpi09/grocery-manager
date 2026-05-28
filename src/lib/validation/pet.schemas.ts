import { z } from 'zod';

export const updatePetsEnabledSchema = z.object({
	enabled: z.enum(['true', 'false'])
});

export const createPetSchema = z.object({
	name: z.string().min(1, 'Pet name is required').max(80),
	species: z.string().max(80).optional().or(z.literal(''))
});

export const deletePetSchema = z.object({
	id: z.string().min(1, 'Pet id is required')
});

export const createPetFoodSchema = z.object({
	petId: z.string().optional().or(z.literal('')),
	name: z.string().min(1, 'Pet food name is required').max(120),
	quantity: z
		.string()
		.min(1)
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Quantity must be positive'),
	unit: z.string().max(20).optional().or(z.literal('')),
	notes: z.string().max(500).optional().or(z.literal(''))
});

export const deletePetFoodSchema = z.object({
	id: z.string().min(1, 'Pet food id is required')
});
