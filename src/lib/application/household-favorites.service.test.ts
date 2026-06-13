import { describe, expect, it, vi } from 'vitest';
import {
	HouseholdFavoritesService,
	MAX_HOUSEHOLD_FAVORITES
} from '$lib/application/household-favorites.service';
import type { IHouseholdFavoriteProductRepository } from '$lib/infrastructure/repositories/household-favorite-product.repository';

function createRepositoryMock(): IHouseholdFavoriteProductRepository {
	return {
		findByKey: vi.fn(),
		findByBarcode: vi.fn(),
		listByHousehold: vi.fn(),
		countByHousehold: vi.fn(),
		deleteByKey: vi.fn(),
		deleteByBarcode: vi.fn(),
		deleteOldest: vi.fn(),
		upsert: vi.fn()
	};
}

describe('HouseholdFavoritesService', () => {
	it('normalizes barcode and display name on save', async () => {
		const repository = createRepositoryMock();
		vi.mocked(repository.findByBarcode).mockResolvedValue(null);
		vi.mocked(repository.findByKey).mockResolvedValue(null);
		vi.mocked(repository.countByHousehold).mockResolvedValue(0);
		vi.mocked(repository.upsert).mockResolvedValue({
			householdId: 'house-1',
			normalizedKey: 'mjölk 3',
			barcode: '7310862000003',
			displayName: 'Mjölk 3%',
			quantity: '1.5',
			unit: 'l',
			notes: null,
			updatedAt: new Date('2026-01-01T00:00:00.000Z')
		});

		const service = new HouseholdFavoritesService(repository);
		const saved = await service.save('house-1', {
			barcode: '731-0862-000003',
			displayName: '  Mjölk 3%  ',
			quantity: '1.5',
			unit: 'l',
			notes: null
		});

		expect(repository.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				normalizedKey: 'mjölk 3',
				barcode: '7310862000003',
				displayName: 'Mjölk 3%'
			})
		);
		expect(saved.displayName).toBe('Mjölk 3%');
	});

	it('drops oldest favorite when at max capacity', async () => {
		const repository = createRepositoryMock();
		vi.mocked(repository.findByBarcode).mockResolvedValue(null);
		vi.mocked(repository.findByKey).mockResolvedValue(null);
		vi.mocked(repository.countByHousehold).mockResolvedValue(MAX_HOUSEHOLD_FAVORITES);
		vi.mocked(repository.upsert).mockResolvedValue({
			householdId: 'house-1',
			normalizedKey: 'yoghurt',
			barcode: '7310862000999',
			displayName: 'Yoghurt',
			quantity: '1',
			unit: null,
			notes: null,
			updatedAt: new Date()
		});

		const service = new HouseholdFavoritesService(repository);
		await service.save('house-1', {
			barcode: '7310862000999',
			displayName: 'Yoghurt',
			quantity: '1',
			unit: null,
			notes: null
		});

		expect(repository.deleteOldest).toHaveBeenCalledWith('house-1');
	});
});
