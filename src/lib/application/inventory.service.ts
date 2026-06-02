import { canEditInventory, type HouseholdRole } from '$lib/domain/household';
import {
	formatNumericQuantity,
	resolveConsumptionAmount,
	type ConsumptionPreset
} from '$lib/domain/consumption-quantity';
import { EXPIRING_SOON_DAYS, buildLocationBars, type LocationBar } from '$lib/domain/inventory-analytics';
import { INVENTORY_LIST_DEFAULT } from '$lib/domain/inventory-list';
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
import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import { resolveWasteEventType } from '$lib/domain/gamification';

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

export class InvalidConsumptionAmountError extends Error {
	constructor() {
		super('Invalid consumption amount');
		this.name = 'InvalidConsumptionAmountError';
	}
}

export interface ConsumeItemOptions {
	preset?: ConsumptionPreset;
	customAmount?: string;
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
	constructor(
		private readonly repository: IInventoryRepository,
		private readonly consumptionRepository?: IConsumptionRepository
	) {}

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

	async listByLocationPaginated(
		householdId: string,
		location: StorageLocation,
		limit = INVENTORY_LIST_DEFAULT,
		offset = 0
	) {
		return this.repository.findByHouseholdAndLocationPaginated(
			householdId,
			location,
			limit,
			offset
		);
	}

	async countActiveByLocation(householdId: string, location: StorageLocation) {
		return this.repository.countActiveByLocation(householdId, location);
	}

	async countFinishedByLocation(householdId: string, location: StorageLocation) {
		return this.repository.countFinishedByLocation(householdId, location);
	}

	async listFinishedByLocation(householdId: string, location: StorageLocation) {
		return this.repository.findFinishedByHouseholdAndLocation(householdId, location);
	}

	async listAll(householdId: string) {
		return this.repository.findAllByHousehold(householdId);
	}

	async listExpiringBefore(householdId: string, beforeDate: string) {
		return this.repository.findExpiringBefore(householdId, beforeDate);
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

	async deleteItem(
		householdId: string,
		id: string,
		userId: string,
		actorRole: HouseholdRole
	) {
		assertInventoryWritable(actorRole);
		const item = await this.repository.findById(householdId, id);
		if (!item) {
			throw new InventoryNotFoundError();
		}

		if (this.consumptionRepository) {
			const eventType = resolveWasteEventType(item);
			if (eventType) {
				await this.consumptionRepository.record({
					id: generateId(),
					householdId,
					userId,
					item,
					eventType
				});
			}
		}

		const deleted = await this.repository.delete(householdId, id);
		if (!deleted) {
			throw new InventoryNotFoundError();
		}
	}

	async consumeItem(
		householdId: string,
		id: string,
		userId: string,
		actorRole: HouseholdRole,
		options: ConsumeItemOptions = {}
	) {
		assertInventoryWritable(actorRole);
		const item = await this.repository.findById(householdId, id);
		if (!item) throw new InventoryNotFoundError();
		const resolved = resolveConsumptionAmount({
			stockQuantity: item.quantity,
			preset: options.customAmount ? undefined : options.preset,
			customAmount: options.customAmount
		});
		if (!resolved.ok) throw new InvalidConsumptionAmountError();
		const newQuantity = resolved.finished ? '0' : formatNumericQuantity(resolved.remaining);
		const updated = await this.repository.update(householdId, id, { quantity: newQuantity });
		if (!updated) throw new InventoryNotFoundError();
		if (this.consumptionRepository) {
			await this.consumptionRepository.record({
				id: generateId(),
				householdId,
				userId,
				item,
				consumedQuantity: formatNumericQuantity(resolved.used),
				consumedUnit: item.unit,
				notes: resolved.finished
					? null
					: `partial:${formatNumericQuantity(resolved.remaining)}`
			});
		}
		return { item: updated, consumed: resolved.used, finished: resolved.finished };
	}

	async markAsFinished(
		householdId: string,
		id: string,
		userId: string,
		actorRole: HouseholdRole,
		options: ConsumeItemOptions = {}
	) {
		const consumeOptions: ConsumeItemOptions =
			options.preset || options.customAmount ? options : { preset: 'all' };
		return (await this.consumeItem(householdId, id, userId, actorRole, consumeOptions)).item;
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
