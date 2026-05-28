import { generateId } from '$lib/infrastructure/auth/id';
import type { CreatePetFoodInput } from '$lib/domain/pet-food';
import type { IPetFoodRepository } from '$lib/infrastructure/repositories/pet-food.repository';

export class PetFoodNotFoundError extends Error {
	constructor() {
		super('Pet food item not found');
		this.name = 'PetFoodNotFoundError';
	}
}

export class PetFoodService {
	constructor(private readonly repository: IPetFoodRepository) {}

	async listPetFood(userId: string) {
		return this.repository.listByUser(userId);
	}

	async addPetFood(userId: string, input: CreatePetFoodInput) {
		return this.repository.create(userId, generateId(), input);
	}

	async deletePetFood(userId: string, id: string) {
		const deleted = await this.repository.delete(userId, id);
		if (!deleted) {
			throw new PetFoodNotFoundError();
		}
	}
}
