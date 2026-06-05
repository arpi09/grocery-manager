import { z } from 'zod';
import { PMF_SURVEY_TRIGGERS, PMF_WOULD_MISS_VALUES } from '$lib/domain/pmf-survey';

export const submitPmfSurveySchema = z.object({
	trigger: z.enum(PMF_SURVEY_TRIGGERS),
	npsScore: z.coerce.number().int().min(0).max(10),
	wouldMiss: z.enum(PMF_WOULD_MISS_VALUES),
	comment: z
		.string()
		.trim()
		.max(500)
		.optional()
		.transform((value) => (value && value.length > 0 ? value : null))
});
