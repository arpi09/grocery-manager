import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
import type {
	CreateInventoryItemInput,
	InventoryItem,
	LocationCount,
	UpdateInventoryItemInput
} from '$lib/domain/inventory-item';
import { generateId } from '$lib/infrastructure/auth/id';
import type { IInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';

export class InventoryNotFoundError extends Error {
	constructor() {
		super('Item not found');
		this.name = 'InventoryNotFoundError';
	}
}

export interface DashboardSummary {
	counts: LocationCount[];
	expiringSoon: InventoryItem[];
	totalItems: number;
}

export class InventoryService {
	constructor(private readonly repository: IInventoryRepository) {}

	async getDashboard(userId: string): Promise<DashboardSummary> {
		const counts = await this.repository.countByLocation(userId);
		const countsByLocation = LOCATIONS.map((location) => {
			const found = counts.find((c) => c.location === location);
			return { location, count: found?.count ?? 0 };
		});

		const beforeDate = addDays(new Date(), 7);
		const expiringSoon = await this.repository.findExpiringBefore(
			userId,
			beforeDate.toISOString().slice(0, 10)
		);

		const totalItems = countsByLocation.reduce((sum, c) => sum + c.count, 0);

		return { counts: countsByLocation, expiringSoon, totalItems };
	}

	async listByLocation(userId: string, location: StorageLocation) {
		return this.repository.findByUserAndLocation(userId, location);
	}

	async listAll(userId: string) {
		return this.repository.findAllByUser(userId);
	}

	async getItem(userId: string, id: string) {
		const item = await this.repository.findById(userId, id);
		if (!item) {
			throw new InventoryNotFoundError();
		}
		return item;
	}

	async createItem(userId: string, input: CreateInventoryItemInput) {
		const id = generateId();
		return this.repository.create(userId, id, input);
	}

	async updateItem(userId: string, id: string, input: UpdateInventoryItemInput) {
		const item = await this.repository.update(userId, id, input);
		if (!item) {
			throw new InventoryNotFoundError();
		}
		return item;
	}

	async deleteItem(userId: string, id: string) {
		const deleted = await this.repository.delete(userId, id);
		if (!deleted) {
			throw new InventoryNotFoundError();
		}
	}
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}
