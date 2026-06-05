import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PmfSurveyService } from './pmf-survey.service';
import type { IPmfSurveyRepository } from '$lib/infrastructure/repositories/pmf-survey.repository';

describe('PmfSurveyService', () => {
	let repository: IPmfSurveyRepository;
	let service: PmfSurveyService;

	beforeEach(() => {
		repository = {
			submit: vi.fn().mockResolvedValue('survey-1'),
			listRecent: vi.fn().mockResolvedValue([]),
			getSummary: vi.fn().mockResolvedValue({
				totalResponses: 0,
				nps: null,
				promoters: 0,
				passives: 0,
				detractors: 0,
				wouldMiss: { yes: 0, somewhat: 0, no: 0 }
			})
		};
		service = new PmfSurveyService(repository);
	});

	it('submits survey responses', async () => {
		const id = await service.submit({
			userId: 'user-1',
			householdId: 'hh-1',
			trigger: 'post_onboarding',
			npsScore: 9,
			wouldMiss: 'yes',
			comment: 'Bra app'
		});

		expect(id).toBe('survey-1');
		expect(repository.submit).toHaveBeenCalledWith({
			userId: 'user-1',
			householdId: 'hh-1',
			trigger: 'post_onboarding',
			npsScore: 9,
			wouldMiss: 'yes',
			comment: 'Bra app'
		});
	});

	it('clamps list limit', async () => {
		await service.listRecent(999);
		expect(repository.listRecent).toHaveBeenCalledWith(200);
	});
});
