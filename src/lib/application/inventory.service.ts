import { canEditInventory, type HouseholdRole } from '$lib/domain/household';
import { EXPIRING_SOON_DAYS, buildLocationBars, type LocationBar } from '$lib/domain/inventory-analytics';
import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
import type {
	CreateInventoryItemInput,
	InventoryItem,
	LocationCount,
	UpdateInventoryItemInput
} from '$lib/domain/inventory-item';
import { generateId } from '$lib/infrastructure/auth/id';
import type {
	IInventoryRepository,
	InventoryAnalyticsSnapshot
} from '$lib/infrastructure/repositories/inventory.repository';

export class InventoryNotFoundError extends Error {
	constructor() {
		super('Item not found');
		this.name = 'InventoryNotFoundError';
	}
}

export class InventoryReadOnlyError extends Error {
	constructor() {
		super('Du har endast läsbehörighet i detta hushåll.');
		this.name = 'InventoryReadOnlyError';
	}
}

export interface DashboardSummary {
	counts: LocationCount[];
	expiringSoon: InventoryItem[];
	totalItems: number;
}

export interface InventoryAnalytics extends InventoryAnalyticsSnapshot {
	byLocationBars: LocationBar[];
}

export class InventoryService {
	constructor(private readonly repository: IInventoryRepository) {}

	async getDashboard(householdId: string): Promise<DashboardSummary> {
		const counts = await this.repository.countByLocation(householdId);
		const countsByLocation = LOCATIONS.map((location) => {
			const found = counts.find((c) => c.location === location);
			return { location, count: found?.count ?? 0 };
		});

		const beforeDate = addDays(new Date(), EXPIRING_SOON_DAYS);
		const expiringSoon = await this.repository.findExpiringBefore(
			householdId,
			beforeDate.toISOString().slice(0, 10)
		);

		const totalItems = countsByLocation.reduce((sum, c) => sum + c.count, 0);

		return { counts: countsByLocation, expiringSoon, totalItems };
	}

	async getAnalytics(householdId: string): Promise<InventoryAnalytics> {
		const snapshot = await this.repository.getAnalytics(householdId);
		const countsByLocation = LOCATIONS.map((location) => {
			const found = snapshot.byLocation.find((c) => c.location === location);
			return { location, count: found?.count ?? 0 };
		});

		return {
			...snapshot,
			byLocation: countsByLocation,
			byLocationBars: buildLocationBars(countsByLocation, snapshot.totalItems)
		};
	}

	async listByLocation(householdId: string, location: StorageLocation) {
		return this.repository.findByHouseholdAndLocation(householdId, location);
	}

	async listAll(householdId: string) {
		return this.repository.findAllByHousehold(householdId);
	}

	async getItem(householdId: string, id: string) {
		const item = await this.repository.findById(householdId, id);
		if (!item) {
			throw new InventoryNotFoundError();
		}
		return item;
	}

	async createItem(
		householdId: string,
		userId: string,
		input: CreateInventoryItemInput,
		actorRole: HouseholdRole
	) {
		assertInventoryWritable(actorRole);
		const id = generateId();
		return this.repository.create(householdId, userId, id, input);
	}

	async updateItem(
		householdId: string,
		id: string,
		input: UpdateInventoryItemInput,
		actorRole: HouseholdRole
	) {
		assertInventoryWritable(actorRole);
		const item = await this.repository.update(householdId, id, input);
		if (!item) {
			throw new InventoryNotFoundError();
		}
		return item;
	}

	async deleteItem(householdId: string, id: string, actorRole: HouseholdRole) {
		assertInventoryWritable(actorRole);
		const deleted = await this.repository.delete(householdId, id);
		if (!deleted) {
			throw new InventoryNotFoundError();
		}
	}
}

function assertInventoryWritable(actorRole: HouseholdRole): void {
	if (!canEditInventory(actorRole)) {
		throw new InventoryReadOnlyError();
	}
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}
