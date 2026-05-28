import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PetService } from './pet.service';
import type { IPetRepository } from '$lib/infrastructure/repositories/pet.repository';
import type { Pet } from '$lib/domain/pet';

function makePet(overrides: Partial<Pet> = {}): Pet {
	return {
		id: 'pet-1',
		userId: 'user-1',
		name: 'Milo',
		species: 'cat',
		createdAt: new Date(),
		...overrides
	};
}

describe('PetService', () => {
	let repository: IPetRepository;
	let service: PetService;

	beforeEach(() => {
		repository = {
			listByUser: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			setPetsEnabled: vi.fn(),
			getPetsEnabled: vi.fn()
		};
		service = new PetService(repository);
	});

	it('lists pets for user', async () => {
		const pets = [makePet()];
		vi.mocked(repository.listByUser).mockResolvedValue(pets);

		const result = await service.listPets('user-1');

		expect(result).toEqual(pets);
	});

	it('adds a pet', async () => {
		const pet = makePet({ name: 'Luna', species: 'dog' });
		vi.mocked(repository.create).mockResolvedValue(pet);

		const result = await service.addPet('user-1', 'Luna', 'dog');

		expect(result).toEqual(pet);
		expect(repository.create).toHaveBeenCalledWith('user-1', expect.any(String), 'Luna', 'dog');
	});

	it('deletes a pet', async () => {
		vi.mocked(repository.delete).mockResolvedValue(true);

		await service.deletePet('user-1', 'pet-1');

		expect(repository.delete).toHaveBeenCalledWith('user-1', 'pet-1');
	});

	it('enables pets for user', async () => {
		await service.setPetsEnabled('user-1', true);

		expect(repository.setPetsEnabled).toHaveBeenCalledWith('user-1', true);
	});

	it('returns pets enabled flag', async () => {
		vi.mocked(repository.getPetsEnabled).mockResolvedValue(true);

		const result = await service.getPetsEnabled('user-1');

		expect(result).toBe(true);
	});
});
