import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PetFoodService } from './pet-food.service';
import type { IPetFoodRepository } from '$lib/infrastructure/repositories/pet-food.repository';
import type { PetFoodItem } from '$lib/domain/pet-food';

function makePetFood(overrides: Partial<PetFoodItem> = {}): PetFoodItem {
	return {
		id: 'food-1',
		userId: 'user-1',
		petId: 'pet-1',
		name: 'Dry food',
		quantity: '2',
		unit: 'kg',
		notes: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

describe('PetFoodService', () => {
	let repository: IPetFoodRepository;
	let service: PetFoodService;

	beforeEach(() => {
		repository = {
			listByUser: vi.fn(),
			create: vi.fn(),
			delete: vi.fn()
		};
		service = new PetFoodService(repository);
	});

	it('lists pet food for user', async () => {
		const items = [makePetFood()];
		vi.mocked(repository.listByUser).mockResolvedValue(items);

		const result = await service.listPetFood('user-1');

		expect(result).toEqual(items);
	});

	it('adds pet food', async () => {
		const item = makePetFood({ name: 'Wet food' });
		vi.mocked(repository.create).mockResolvedValue(item);

		const result = await service.addPetFood('user-1', {
			petId: 'pet-1',
			name: 'Wet food',
			quantity: '6',
			unit: 'cans'
		});

		expect(result.name).toBe('Wet food');
		expect(repository.create).toHaveBeenCalledWith(
			'user-1',
			expect.any(String),
			expect.objectContaining({ name: 'Wet food', petId: 'pet-1' })
		);
	});

	it('deletes pet food', async () => {
		vi.mocked(repository.delete).mockResolvedValue(true);

		await service.deletePetFood('user-1', 'food-1');

		expect(repository.delete).toHaveBeenCalledWith('user-1', 'food-1');
	});
});
