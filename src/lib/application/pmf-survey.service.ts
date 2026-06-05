import {
	PMF_SURVEY_LIST_DEFAULT,
	PMF_SURVEY_LIST_MAX,
	type PmfSurveyResponseEntry,
	type PmfSurveySummary,
	type SubmitPmfSurveyInput
} from '$lib/domain/pmf-survey';
import type { IPmfSurveyRepository } from '$lib/infrastructure/repositories/pmf-survey.repository';

export class PmfSurveyService {
	constructor(private readonly repository: IPmfSurveyRepository) {}

	async submit(input: SubmitPmfSurveyInput): Promise<string> {
		return this.repository.submit(input);
	}

	async listRecent(limit = PMF_SURVEY_LIST_DEFAULT): Promise<PmfSurveyResponseEntry[]> {
		const safeLimit = Math.min(PMF_SURVEY_LIST_MAX, Math.max(1, Math.floor(limit)));
		return this.repository.listRecent(safeLimit);
	}

	async getSummary(): Promise<PmfSurveySummary> {
		return this.repository.getSummary();
	}
}
