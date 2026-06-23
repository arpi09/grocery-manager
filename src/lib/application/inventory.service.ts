import {

	DEFAULT_AUTO_EXPIRED_GRACE_DAYS,

	normalizeAutoExpiredGraceDays,

	type AutoExpiredGraceDays

} from '$lib/domain/auto-expired';

import {
	canConsumeInventory,
	canEditInventory,
	type HouseholdRole
} from '$lib/domain/household';

import {

	formatNumericQuantity,

	resolveConsumptionAmount,

	type ConsumptionPreset

} from '$lib/domain/consumption-quantity';

import { EXPIRING_SOON_DAYS, buildLocationBars, type LocationBar } from '$lib/domain/inventory-analytics';
import {
	addQuantities,
	findDuplicateNameGroups,
	findMergeCandidate,
	findMergeCandidateWithScore
} from '$lib/domain/inventory-merge';
import { confirmSameProductMerge } from '$lib/server/inventory-merge-ai';
import { isMovingToAutoExpiredSoon } from '$lib/domain/auto-expired';
import { computeSyncHealthLevel, type SyncHealthLevel } from '$lib/domain/sync-health';

import { INVENTORY_LIST_DEFAULT, INVENTORY_LIST_MAX } from '$lib/domain/inventory-list';
import { STALENESS_BATCH_SIZE } from '$lib/domain/inventory-staleness';

import { LOCATIONS, type StorageLocation } from '$lib/domain/location';

import type {

	CreateInventoryItemInput,

	InventoryItem,

	LocationCount,

	UpdateInventoryItemInput

} from '$lib/domain/inventory-item';

import { generateId } from '$lib/infrastructure/auth/id';
import { isMissingLastConfirmedColumn } from '$lib/infrastructure/repositories/inventory-repository.shared';

import type {

	IInventoryRepository,

	InventoryAnalyticsSnapshot,

	InventoryListContext

} from '$lib/infrastructure/repositories/inventory.repository';

import type { IHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';

import type { ShelfLifeInferencePort } from '$lib/application/ports/shelf-life-inference.port';

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



export interface PantryStatusSummary {

	withoutExpiryCount: number;

	autoExpiredCount: number;

	staleCount: number;

	lastUpdatedAt: Date | null;

	lastUpdatedByUserId: string | null;

	syncHealth: SyncHealthLevel;

}

export interface DuplicateNameGroupSummary {
	displayName: string;
	count: number;
	location: StorageLocation;
}

export interface DashboardSummary {

	counts: LocationCount[];

	expiringSoon: InventoryItem[];

	totalItems: number;

	pantryStatus: PantryStatusSummary;

}



export interface InventoryAnalytics extends InventoryAnalyticsSnapshot {

	byLocationBars: LocationBar[];

}



export class InventoryService {

	constructor(

		private readonly repository: IInventoryRepository,

		private readonly consumptionRepository?: IConsumptionRepository,

		private readonly householdRepository?: Pick<

			IHouseholdRepository,

			'getAutoExpiredGraceDays' | 'updateAutoExpiredGraceDays'

		>,

		private readonly shelfLifeInference?: ShelfLifeInferencePort

	) {}



	private async listContext(householdId: string): Promise<InventoryListContext> {

		const graceDays = this.householdRepository

			? await this.householdRepository.getAutoExpiredGraceDays(householdId)

			: DEFAULT_AUTO_EXPIRED_GRACE_DAYS;

		return { graceDays };

	}



	async getAutoExpiredGraceDays(householdId: string): Promise<AutoExpiredGraceDays> {

		if (this.householdRepository) {

			return this.householdRepository.getAutoExpiredGraceDays(householdId);

		}

		return DEFAULT_AUTO_EXPIRED_GRACE_DAYS;

	}



	async updateAutoExpiredGraceDays(

		householdId: string,

		days: number,

		actorRole: HouseholdRole

	): Promise<void> {

		assertInventoryWritable(actorRole);

		if (!this.householdRepository) {

			throw new InventoryReadOnlyError();

		}

		await this.householdRepository.updateAutoExpiredGraceDays(

			householdId,

			normalizeAutoExpiredGraceDays(days)

		);

	}



	async getDashboard(householdId: string): Promise<DashboardSummary> {

		const context = await this.listContext(householdId);

		const counts = await this.repository.countByLocation(householdId, context);

		const countsByLocation = LOCATIONS.map((location) => {

			const found = counts.find((c) => c.location === location);

			return { location, count: found?.count ?? 0 };

		});



		const beforeDate = addDays(new Date(), EXPIRING_SOON_DAYS);

		let expiringSoon: InventoryItem[] = [];

		try {

			expiringSoon = await this.repository.findExpiringBefore(

				householdId,

				beforeDate.toISOString().slice(0, 10),

				context

			);

		} catch (error) {

			if (!isMissingLastConfirmedColumn(error)) {

				throw error;

			}

			console.warn('[inventory] findExpiringBefore degraded — last_confirmed_at missing');

		}



		const totalItems = countsByLocation.reduce((sum, c) => sum + c.count, 0);

		let pantryStatus: PantryStatusSummary = {

			withoutExpiryCount: 0,

			autoExpiredCount: 0,

			staleCount: 0,

			lastUpdatedAt: null,

			lastUpdatedByUserId: null,

			syncHealth: 'good'

		};

		try {

			const [analytics, autoExpiredCount, staleCount, lastUpdate] = await Promise.all([

				this.repository.getAnalytics(householdId, context),

				this.repository.countAutoExpiredHousehold(householdId, context),

				this.repository.countStaleUndated(householdId),

				this.repository.getLastInventoryUpdate(householdId)

			]);

			pantryStatus = {

				withoutExpiryCount: analytics.withoutExpiryCount,

				autoExpiredCount,

				staleCount,

				lastUpdatedAt: lastUpdate?.updatedAt ?? null,

				lastUpdatedByUserId: lastUpdate?.userId ?? null,

				syncHealth: computeSyncHealthLevel({

					totalItems,

					withoutExpiryCount: analytics.withoutExpiryCount,

					staleCount

				})

			};

		} catch (error) {

			if (!isMissingLastConfirmedColumn(error)) {

				throw error;

			}

			console.warn('[inventory] pantry status degraded — last_confirmed_at missing');

		}

		return {
			counts: countsByLocation,
			expiringSoon,
			totalItems,
			pantryStatus
		};

	}



	async getAnalytics(householdId: string): Promise<InventoryAnalytics> {

		const context = await this.listContext(householdId);

		const snapshot = await this.repository.getAnalytics(householdId, context);

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

		const context = await this.listContext(householdId);

		return this.repository.findByHouseholdAndLocation(householdId, location, context);

	}



	async listByLocationPaginated(

		householdId: string,

		location: StorageLocation,

		limit = INVENTORY_LIST_DEFAULT,

		offset = 0

	) {

		const context = await this.listContext(householdId);

		return this.repository.findByHouseholdAndLocationPaginated(

			householdId,

			location,

			limit,

			offset,

			context

		);

	}



	async searchActiveByLocation(

		householdId: string,

		location: StorageLocation,

		query: string,

		limit = INVENTORY_LIST_MAX

	) {

		const context = await this.listContext(householdId);

		return this.repository.searchActiveByLocation(

			householdId,

			location,

			query,

			context,

			limit

		);

	}



	async countActiveByLocation(householdId: string, location: StorageLocation) {

		const context = await this.listContext(householdId);

		return this.repository.countActiveByLocation(householdId, location, context);

	}

	async countActiveInventory(householdId: string): Promise<number> {
		const context = await this.listContext(householdId);
		const counts = await this.repository.countByLocation(householdId, context);
		return counts.reduce((sum, entry) => sum + entry.count, 0);
	}



	async countAutoExpiredByLocation(householdId: string, location: StorageLocation) {

		const context = await this.listContext(householdId);

		return this.repository.countAutoExpiredByLocation(householdId, location, context);

	}



	async listAutoExpiredByLocation(householdId: string, location: StorageLocation) {

		const context = await this.listContext(householdId);

		return this.repository.findAutoExpiredByHouseholdAndLocation(

			householdId,

			location,

			context

		);

	}



	async countFinishedByLocation(householdId: string, location: StorageLocation) {

		return this.repository.countFinishedByLocation(householdId, location);

	}



	async listFinishedByLocation(householdId: string, location: StorageLocation) {

		return this.repository.findFinishedByHouseholdAndLocation(householdId, location);

	}



	async listAll(householdId: string) {

		const context = await this.listContext(householdId);

		return this.repository.findAllByHousehold(householdId, context);

	}



	async listExpiringBefore(householdId: string, beforeDate: string) {

		const context = await this.listContext(householdId);

		return this.repository.findExpiringBefore(householdId, beforeDate, context);

	}



	async bulkDiscardAutoExpired(

		householdId: string,

		location: StorageLocation,

		userId: string,

		actorRole: HouseholdRole

	): Promise<number> {

		assertInventoryWritable(actorRole);

		const items = await this.listAutoExpiredByLocation(householdId, location);

		for (const item of items) {

			await this.deleteItem(householdId, item.id, userId, actorRole);

		}

		return items.length;

	}



	async getItem(householdId: string, id: string) {

		const item = await this.repository.findById(householdId, id);

		if (!item) {

			throw new InventoryNotFoundError();

		}

		return item;

	}



	async findMergeCandidate(householdId: string, name: string, location: StorageLocation) {
		const items = await this.listAll(householdId);
		return findMergeCandidate(items, name, location);
	}

	async listRecentItemNames(householdId: string, limit = 12): Promise<string[]> {
		return this.repository.listRecentActiveNames(householdId, limit);
	}

	async findDuplicateNameGroups(
		householdId: string,
		minCount = 3
	): Promise<DuplicateNameGroupSummary[]> {
		try {
			const items = await this.listAll(householdId);
			return findDuplicateNameGroups(items, minCount).map((group) => ({
				displayName: group.displayName,
				count: group.count,
				location: group.location
			}));
		} catch (error) {
			if (isMissingLastConfirmedColumn(error)) {
				console.warn('[inventory] findDuplicateNameGroups degraded — last_confirmed_at missing');
				return [];
			}
			throw error;
		}
	}

	async listMovingToAutoExpiredSoon(householdId: string): Promise<InventoryItem[]> {
		const context = await this.listContext(householdId);
		const items = await this.repository.findAllByHousehold(householdId, context);
		const today = new Date();
		return items
			.filter((item) => isMovingToAutoExpiredSoon(item, context.graceDays, today))
			.sort((a, b) => (a.expiresOn ?? '').localeCompare(b.expiresOn ?? ''));
	}

	async bulkInferExpiryForLocation(
		householdId: string,
		location: StorageLocation,
		actorRole: HouseholdRole
	): Promise<number> {
		assertInventoryWritable(actorRole);
		return this.inferMissingExpiryForItems(householdId, location);
	}

	/** Cron/admin: infer BBF for active items missing expiresOn (max `limit` per call). */
	async backfillMissingExpiryDates(householdId: string, limit = 40): Promise<number> {
		if (!this.shelfLifeInference) return 0;
		let inferredCount = 0;
		for (const location of LOCATIONS) {
			if (inferredCount >= limit) break;
			const remaining = limit - inferredCount;
			const batch = await this.inferMissingExpiryForItems(householdId, location, remaining);
			inferredCount += batch;
		}
		return inferredCount;
	}

	private async inferMissingExpiryForItems(
		householdId: string,
		location: StorageLocation,
		limit = 40
	): Promise<number> {
		if (!this.shelfLifeInference) return 0;
		const items = await this.listByLocation(householdId, location);
		let inferredCount = 0;
		for (const item of items) {
			if (inferredCount >= limit) break;
			if (item.expiresOn) continue;
			const inferred = await this.shelfLifeInference.inferShelfLife({
				name: item.name,
				location: item.location,
				householdId
			});
			if (!inferred?.expiresOn) continue;
			const updated = await this.repository.update(householdId, item.id, {
				expiresOn: inferred.expiresOn,
				expiresOnSource: inferred.source
			});
			if (updated) inferredCount += 1;
		}
		return inferredCount;
	}

	async confirmStaleBatch(
		householdId: string,
		itemIds: string[],
		actorRole: HouseholdRole
	): Promise<number> {
		assertInventoryWritable(actorRole);
		let confirmed = 0;
		for (const id of itemIds) {
			try {
				await this.confirmStillHave(householdId, id, actorRole);
				confirmed += 1;
			} catch {
				// skip missing rows
			}
		}
		return confirmed;
	}

	async consumeItemsMany(
		householdId: string,
		itemIds: string[],
		userId: string,
		actorRole: HouseholdRole
	): Promise<number> {
		assertInventoryConsumable(actorRole);
		let consumed = 0;
		for (const id of itemIds) {
			try {
				await this.consumeItem(householdId, id, userId, actorRole, { preset: 'all' });
				consumed += 1;
			} catch {
				// skip missing or invalid rows
			}
		}
		return consumed;
	}

	async deleteItemsMany(
		householdId: string,
		itemIds: string[],
		userId: string,
		actorRole: HouseholdRole
	): Promise<number> {
		assertInventoryWritable(actorRole);
		let deleted = 0;
		for (const id of itemIds) {
			try {
				await this.deleteItem(householdId, id, userId, actorRole);
				deleted += 1;
			} catch {
				// skip missing rows
			}
		}
		return deleted;
	}

	async findMergeCandidates(
		householdId: string,
		lines: Array<{ name: string; location: StorageLocation; categoryHint?: string | null }>,
		options: { apiKey?: string } = {}
	) {
		const items = await this.listAll(householdId);
		const matches = [];
		for (const [index, line] of lines.entries()) {
			const candidate = findMergeCandidateWithScore(items, line.name, line.location);
			if (!candidate) {
				matches.push(null);
				continue;
			}
			if (candidate.grayZone && options.apiKey) {
				const confirmed = await confirmSameProductMerge(
					options.apiKey,
					line.name,
					candidate.item.name,
					{
						location: line.location,
						categoryHint: line.categoryHint ?? null
					}
				);
				if (confirmed === false) {
					matches.push(null);
					continue;
				}
			} else if (candidate.grayZone) {
				matches.push(null);
				continue;
			}
			matches.push({
				index,
				id: candidate.item.id,
				name: candidate.item.name,
				quantity: candidate.item.quantity,
				unit: candidate.item.unit
			});
		}
		return matches;
	}

	async incrementQuantity(
		householdId: string,
		id: string,
		addQuantity: string,
		actorRole: HouseholdRole
	) {
		assertInventoryWritable(actorRole);
		const item = await this.repository.findById(householdId, id);
		if (!item) {
			throw new InventoryNotFoundError();
		}
		const merged = addQuantities(item.quantity, addQuantity);
		if (merged === null) {
			throw new InvalidConsumptionAmountError();
		}
		const updated = await this.repository.update(householdId, id, {
			quantity: merged,
			lastConfirmedAt: new Date()
		});
		if (!updated) {
			throw new InventoryNotFoundError();
		}
		return updated;
	}

	async countStaleUndated(householdId: string): Promise<number> {
		return this.repository.countStaleUndated(householdId);
	}

	async listStaleUndatedBatch(
		householdId: string,
		limit = STALENESS_BATCH_SIZE
	): Promise<InventoryItem[]> {
		return this.repository.findStaleUndated(householdId, limit);
	}

	async confirmStillHave(
		householdId: string,
		id: string,
		actorRole: HouseholdRole
	): Promise<InventoryItem> {
		assertInventoryWritable(actorRole);
		const updated = await this.repository.update(householdId, id, { lastConfirmedAt: new Date() });
		if (!updated) {
			throw new InventoryNotFoundError();
		}
		return updated;
	}

	async createItem(

		householdId: string,

		userId: string,

		input: CreateInventoryItemInput,

		actorRole: HouseholdRole

	) {

		assertInventoryWritable(actorRole);

		if (input.mergeIntoId) {
			return this.incrementQuantity(householdId, input.mergeIntoId, input.quantity, actorRole);
		}

		let expiresOn = input.expiresOn ?? null;

		let expiresOnSource = input.expiresOnSource ?? (expiresOn ? 'user_set' : null);

		if (!expiresOn && input.inferExpiry !== false) {

			const inferred = this.shelfLifeInference
				? await this.shelfLifeInference.inferShelfLife({
						name: input.name,
						location: input.location,
						householdId
					})
				: null;

			if (inferred) {

				expiresOn = inferred.expiresOn;

				expiresOnSource = inferred.source;

			}

		}

		const id = generateId();

		return this.repository.create(householdId, userId, id, {

			...input,

			expiresOn,

			expiresOnSource

		});

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

		assertInventoryConsumable(actorRole);

		const item = await this.repository.findById(householdId, id);

		if (!item) throw new InventoryNotFoundError();

		const resolved = resolveConsumptionAmount({

			stockQuantity: item.quantity,

			preset: options.customAmount ? undefined : options.preset,

			customAmount: options.customAmount

		});

		if (!resolved.ok) throw new InvalidConsumptionAmountError();

		const newQuantity = resolved.finished ? '0' : formatNumericQuantity(resolved.remaining);

		const updated = await this.repository.update(householdId, id, {
			quantity: newQuantity,
			lastConfirmedAt: new Date()
		});

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

function assertInventoryConsumable(actorRole: HouseholdRole): void {
	if (!canConsumeInventory(actorRole)) {
		throw new InventoryReadOnlyError();
	}
}



function addDays(date: Date, days: number): Date {

	const result = new Date(date);

	result.setDate(result.getDate() + days);

	return result;

}

