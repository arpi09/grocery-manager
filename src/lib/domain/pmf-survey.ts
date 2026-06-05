export const PMF_SURVEY_TRIGGERS = ['post_onboarding', 'periodic'] as const;
export type PmfSurveyTrigger = (typeof PMF_SURVEY_TRIGGERS)[number];

export const PMF_WOULD_MISS_VALUES = ['yes', 'somewhat', 'no'] as const;
export type PmfWouldMiss = (typeof PMF_WOULD_MISS_VALUES)[number];

export const PMF_SURVEY_LIST_DEFAULT = 50;
export const PMF_SURVEY_LIST_MAX = 200;

/** Days after activation before first PMF prompt. */
export const PMF_SURVEY_FIRST_DELAY_MS = 3 * 24 * 60 * 60 * 1000;
/** Cooldown after dismiss without submit. */
export const PMF_SURVEY_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
/** Cooldown after a completed survey. */
export const PMF_SURVEY_SUBMIT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export interface PmfSurveyResponseEntry {
	id: string;
	userId: string;
	userEmail: string;
	householdId: string | null;
	trigger: PmfSurveyTrigger;
	npsScore: number;
	wouldMiss: PmfWouldMiss;
	comment: string | null;
	createdAt: Date;
}

export interface SubmitPmfSurveyInput {
	userId: string;
	householdId: string | null;
	trigger: PmfSurveyTrigger;
	npsScore: number;
	wouldMiss: PmfWouldMiss;
	comment: string | null;
}

export interface PmfSurveySummary {
	totalResponses: number;
	nps: number | null;
	promoters: number;
	passives: number;
	detractors: number;
	wouldMiss: Record<PmfWouldMiss, number>;
}

export function isPmfSurveyTrigger(value: string): value is PmfSurveyTrigger {
	return (PMF_SURVEY_TRIGGERS as readonly string[]).includes(value);
}

export function isPmfWouldMiss(value: string): value is PmfWouldMiss {
	return (PMF_WOULD_MISS_VALUES as readonly string[]).includes(value);
}

export function computeNpsSummary(scores: number[]): Pick<
	PmfSurveySummary,
	'nps' | 'promoters' | 'passives' | 'detractors'
> {
	let promoters = 0;
	let passives = 0;
	let detractors = 0;

	for (const score of scores) {
		if (score >= 9) {
			promoters++;
		} else if (score >= 7) {
			passives++;
		} else {
			detractors++;
		}
	}

	const total = scores.length;
	if (total === 0) {
		return { nps: null, promoters: 0, passives: 0, detractors: 0 };
	}

	return {
		nps: Math.round(((promoters - detractors) / total) * 100),
		promoters,
		passives,
		detractors
	};
}
