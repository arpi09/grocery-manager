import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ProductFeedbackService } from './product-feedback.service';
import type { IProductFeedbackRepository } from '$lib/infrastructure/repositories/product-feedback.repository';

describe('ProductFeedbackService', () => {
	let repository: IProductFeedbackRepository;
	let service: ProductFeedbackService;

	beforeEach(() => {
		repository = {
			submit: vi.fn().mockResolvedValue('fb-1'),
			listRecent: vi.fn().mockResolvedValue([])
		};
		service = new ProductFeedbackService(repository);
	});

	it('submits feedback', async () => {
		const id = await service.submit({
			userId: 'user-1',
			householdId: 'house-1',
			source: 'settings',
			churnReason: 'forgot_habit',
			message: 'Glömmer öppna appen'
		});

		expect(id).toBe('fb-1');
		expect(repository.submit).toHaveBeenCalledWith({
			userId: 'user-1',
			householdId: 'house-1',
			source: 'settings',
			churnReason: 'forgot_habit',
			message: 'Glömmer öppna appen'
		});
	});

	it('clamps list limit', async () => {
		await service.listRecent(500);
		expect(repository.listRecent).toHaveBeenCalledWith(100);

		await service.listRecent(0);
		expect(repository.listRecent).toHaveBeenCalledWith(1);
	});
});
