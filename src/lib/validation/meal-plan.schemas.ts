import { toIsoDate } from '$lib/domain/statistik';
import { z } from 'zod';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createMealSchema = z.object({
	title: z.string().min(1, 'Meal title is required').max(120),
	plannedDate: z.string().regex(isoDateRegex, 'Valid date is required'),
	notes: z.string().max(600).optional().or(z.literal(''))
});

export const updateMealSchema = createMealSchema.extend({
	id: z.string().min(1, 'Meal id is required')
});

export const deleteMealSchema = z.object({
	id: z.string().min(1, 'Meal id is required')
});

export const scheduleIdeaSchema = z.object({
	ideaId: z.string().min(1, 'Recipe idea id is required'),
	plannedDate: z.string().regex(isoDateRegex, 'Valid date is required')
});

const weeklyMealAssignmentSchema = z.object({
	ideaId: z.string().min(1, 'Recipe idea id is required'),
	plannedDate: z.string().regex(isoDateRegex, 'Valid date is required')
});

export const approveWeeklyRitualSchema = z
	.object({
		assignments: z
			.array(weeklyMealAssignmentSchema)
			.min(1, 'At least one assignment is required')
			.max(5),
		addMissingToList: z.boolean().optional().default(true)
	})
	.superRefine((data, ctx) => {
		const today = toIsoDate(new Date());
		for (let index = 0; index < data.assignments.length; index += 1) {
			const { plannedDate } = data.assignments[index]!;
			if (plannedDate < today) {
				ctx.addIssue({
					code: 'custom',
					message: 'Planned date must be today or later',
					path: ['assignments', index, 'plannedDate']
				});
			}
		}
	});
