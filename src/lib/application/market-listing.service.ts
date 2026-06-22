import type { BillingService } from '$lib/application/billing.service';
import type { ExpiringShareService } from '$lib/application/expiring-share.service';
import type { HouseholdService } from '$lib/application/household.service';
import type { InventoryService } from '$lib/application/inventory.service';
import type { PmfService } from '$lib/application/pmf.service';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	EXPIRING_SHARE_PRO_TTL_MS,
	EXPIRING_SHARE_TTL_MS,
	type ExpiringShareSnapshot
} from '$lib/domain/expiring-share';
import {
	coarseGeoCoordinate,
	isValidLatitude,
	isValidLongitude
} from '$lib/domain/geo';
import { isMarketV01BackendEnabled } from '$lib/domain/market-v01';
import {
	applyPricingToItemSnapshot,
	resolveAutoListingItemPricing,
	type MarketItemPricingInput
} from '$lib/domain/market-pricing';
import { isProTier, resolveEffectivePlanTier } from '$lib/domain/plan';
import type { ProductEventType } from '$lib/domain/pmf';
import type { IExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';
import type { IPriceMemoryRepository } from '$lib/infrastructure/repositories/price-memory.repository';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { recordProductEvent } from '$lib/server/product-events';

export type AutoListingRefreshResult =
	| { status: 'skipped'; reason: 'disabled' | 'flag_off' | 'no_nearby_geo' | 'no_items' }
	| { status: 'cleared'; shareId: string }
	| { status: 'published'; shareId: string; itemCount: number };

export interface AutoListingBatchResult {
	processed: number;
	published: number;
	cleared: number;
	skipped: number;
}

export class MarketListingService {
	constructor(
		private readonly expiringShareService: ExpiringShareService,
		private readonly expiringShareRepository: IExpiringShareRepository,
		private readonly inventoryService: InventoryService,
		private readonly userRepository: IUserRepository,
		private readonly householdService: HouseholdService,
		private readonly billingService: BillingService,
		private readonly pmfService: PmfService,
		private readonly priceMemoryRepository: IPriceMemoryRepository
	) {}

	async refreshAutoNearbyListing(
		householdId: string,
		userId: string,
		options?: { userRole?: string | null }
	): Promise<AutoListingRefreshResult> {
		if (!isMarketV01BackendEnabled()) {
			return { status: 'skipped', reason: 'disabled' };
		}

		const enabled = await this.userRepository.getAutoNearbyListingEnabled(userId);
		if (!enabled) {
			return { status: 'skipped', reason: 'flag_off' };
		}

		const hadActive = await this.expiringShareRepository.findActiveAutoNearbyListing(householdId);
		const inventory = await this.inventoryService.listAll(householdId);
		const listingSettings = await this.userRepository.getMarketListingSettings(userId);
		const baseSnapshot = this.expiringShareService.buildSnapshot(inventory);
		const snapshot = await this.enrichSnapshotWithPricing(
			householdId,
			inventory,
			baseSnapshot,
			listingSettings.marketDefaultPricePercent
		);

		if (snapshot.items.length === 0) {
			if (hadActive) {
				await this.expiringShareRepository.clearAutoNearbyListing(householdId);
				this.emitEvent(userId, householdId, 'market_auto_listing_cleared', {
					shareId: hadActive.id
				});
				return { status: 'cleared', shareId: hadActive.id };
			}
			return { status: 'skipped', reason: 'no_items' };
		}

		const settings = await this.expiringShareService.getNearbySharingSettings(userId);
		const raw =
			settings.latitude != null && settings.longitude != null
				? { latitude: settings.latitude, longitude: settings.longitude }
				: null;

		if (!settings.enabled || !raw || !isValidLatitude(raw.latitude) || !isValidLongitude(raw.longitude)) {
			return { status: 'skipped', reason: 'no_nearby_geo' };
		}

		const geo = coarseGeoCoordinate(raw);
		const planTier = await this.billingService.getPlanTier(householdId);
		const effectiveTier = resolveEffectivePlanTier(
			{ role: options?.userRole ?? null },
			planTier
		);
		const ttlMs = isProTier(effectiveTier) ? EXPIRING_SHARE_PRO_TTL_MS : EXPIRING_SHARE_TTL_MS;
		const expiresAt = new Date(Date.now() + ttlMs);

		const { id: shareId } = await this.expiringShareRepository.upsertAutoNearbyListing({
			householdId,
			createdByUserId: userId,
			snapshot,
			expiresAt,
			latitude: geo.latitude,
			longitude: geo.longitude
		});

		if (!hadActive) {
			this.emitEvent(userId, householdId, 'market_auto_listing_published', {
				shareId,
				itemCount: snapshot.items.length
			});
			if (snapshot.items.some((item) => item.pricingMode === 'percent_of_reference')) {
				this.emitEvent(userId, householdId, 'market_listing_priced', {
					shareId,
					itemCount: snapshot.items.length
				});
			}
		}

		return { status: 'published', shareId, itemCount: snapshot.items.length };
	}

	async refreshAutoNearbyListingForUser(
		userId: string,
		options?: { userRole?: string | null }
	): Promise<AutoListingBatchResult> {
		const summary: AutoListingBatchResult = {
			processed: 0,
			published: 0,
			cleared: 0,
			skipped: 0
		};

		if (!isMarketV01BackendEnabled()) {
			return summary;
		}

		const enabled = await this.userRepository.getAutoNearbyListingEnabled(userId);
		if (!enabled) {
			return summary;
		}

		const households = await this.householdService.listHouseholdsForUser(userId);
		for (const household of households) {
			summary.processed += 1;
			const result = await this.refreshAutoNearbyListing(household.id, userId, options);
			this.tallyBatchResult(summary, result);
		}

		return summary;
	}

	async buildListingSnapshot(
		householdId: string,
		userId: string,
		options?: { itemPricing?: Record<string, MarketItemPricingInput | undefined> }
	): Promise<ExpiringShareSnapshot> {
		const inventory = await this.inventoryService.listAll(householdId);
		const listingSettings = await this.userRepository.getMarketListingSettings(userId);
		const baseSnapshot = this.expiringShareService.buildSnapshot(inventory, {
			itemPricing: options?.itemPricing
		});
		return this.enrichSnapshotWithPricing(
			householdId,
			inventory,
			baseSnapshot,
			listingSettings.marketDefaultPricePercent
		);
	}

	async clearAutoListingsForUser(userId: string): Promise<AutoListingBatchResult> {
		const summary: AutoListingBatchResult = {
			processed: 0,
			published: 0,
			cleared: 0,
			skipped: 0
		};

		const households = await this.householdService.listHouseholdsForUser(userId);
		for (const household of households) {
			summary.processed += 1;
			const hadActive = await this.expiringShareRepository.findActiveAutoNearbyListing(household.id);
			if (!hadActive) {
				summary.skipped += 1;
				continue;
			}

			await this.expiringShareRepository.clearAutoNearbyListing(household.id);
			this.emitEvent(userId, household.id, 'market_auto_listing_cleared', {
				shareId: hadActive.id
			});
			summary.cleared += 1;
		}

		return summary;
	}

	async runAutoListingRefreshBatch(): Promise<AutoListingBatchResult> {
		const summary: AutoListingBatchResult = {
			processed: 0,
			published: 0,
			cleared: 0,
			skipped: 0
		};

		if (!isMarketV01BackendEnabled()) {
			return summary;
		}

		const users = await this.userRepository.listUsersWithAutoNearbyListingEnabled();
		for (const user of users) {
			const userSummary = await this.refreshAutoNearbyListingForUser(user.id);
			summary.processed += userSummary.processed;
			summary.published += userSummary.published;
			summary.cleared += userSummary.cleared;
			summary.skipped += userSummary.skipped;
		}

		return summary;
	}

	private async enrichSnapshotWithPricing(
		householdId: string,
		inventory: InventoryItem[],
		snapshot: ExpiringShareSnapshot,
		defaultPricePercent: number | null
	): Promise<ExpiringShareSnapshot> {
		const inventoryByName = new Map<string, InventoryItem[]>();
		for (const item of inventory) {
			const bucket = inventoryByName.get(item.name) ?? [];
			bucket.push(item);
			inventoryByName.set(item.name, bucket);
		}

		const pricedItems = await Promise.all(
			snapshot.items.map(async (itemSnapshot) => {
				if (itemSnapshot.pricingMode && itemSnapshot.pricingMode !== 'free') {
					return itemSnapshot;
				}

				const candidates = inventoryByName.get(itemSnapshot.name) ?? [];
				const inventoryItem =
					candidates.find(
						(candidate) =>
							candidate.quantity === itemSnapshot.quantity &&
							candidate.location === itemSnapshot.location
					) ?? candidates[0];
				if (!inventoryItem) {
					return itemSnapshot;
				}

				const summary = await this.priceMemoryRepository.getSummaryByInventoryItemId(
					householdId,
					inventoryItem.id
				);
				const unitPrice = summary?.lastPaid?.unitPrice ?? null;
				const pricing = resolveAutoListingItemPricing({
					quantity: itemSnapshot.quantity,
					unitPrice,
					defaultPricePercent
				});

				if (pricing.pricingMode === 'free') {
					return itemSnapshot;
				}

				return applyPricingToItemSnapshot(itemSnapshot, pricing);
			})
		);

		return {
			...snapshot,
			items: pricedItems
		};
	}

	private tallyBatchResult(summary: AutoListingBatchResult, result: AutoListingRefreshResult): void {
		if (result.status === 'published') {
			summary.published += 1;
		} else if (result.status === 'cleared') {
			summary.cleared += 1;
		} else {
			summary.skipped += 1;
		}
	}

	private emitEvent(
		userId: string,
		householdId: string,
		eventType: ProductEventType,
		metadata: Record<string, unknown>
	): void {
		recordProductEvent(this.pmfService, {
			userId,
			householdId,
			eventType,
			metadata
		});
	}
}
