import { generateId } from '$lib/infrastructure/auth/id';
import type { IPetRepository } from '$lib/infrastructure/repositories/pet.repository';

export class PetNotFoundError extends Error {
	constructor() {
		super('Pet not found');
		this.name = 'PetNotFoundError';
	}
}

export class PetService {
	constructor(private readonly repository: IPetRepository) {}

	async listPets(userId: string) {
		return this.repository.listByUser(userId);
	}

	async addPet(userId: string, name: string, species: string | null) {
		return this.repository.create(userId, generateId(), name, species);
	}

	async deletePet(userId: string, id: string) {
		const deleted = await this.repository.delete(userId, id);
		if (!deleted) {
			throw new PetNotFoundError();
		}
	}

	async setPetsEnabled(userId: string, enabled: boolean) {
		await this.repository.setPetsEnabled(userId, enabled);
	}

	async getPetsEnabled(userId: string) {
		return this.repository.getPetsEnabled(userId);
	}
}
