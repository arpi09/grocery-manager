import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import {
	EXPIRING_SHARE_PRO_TTL_MS,
	EXPIRING_SHARE_TTL_MS,
	type ExpiringShareItemSnapshot,
	type ExpiringSharePreview,
	type ExpiringShareReportInput,
	type ExpiringShareSnapshot,
	type NearbyExpiringShare,
	type NearbySharingSettings
} from '$lib/domain/expiring-share';
import {
	approximateDistanceMetres,
	coarseGeoCoordinate,
	distanceMetres,
	geoBoundingBox,
	isValidLatitude,
	isValidLongitude,
	jitterCoordinateForDisplay,
	type GeoCoordinate
} from '$lib/domain/geo';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	applyPricingToItemSnapshot,
	type MarketItemPricingInput,
	resolveMarketItemPricing
} from '$lib/domain/market-pricing';
import { getNearbyRadiusM, isProTier, resolveEffectivePlanTier, type PlanTier } from '$lib/domain/plan';
import { generateSecureToken, hashSecureToken } from '$lib/infrastructure/auth/secure-token';
import type { IExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';

export class ExpiringShareService {
	constructor(private readonly repository: IExpiringShareRepository) {}

	buildSnapshot(
		items: InventoryItem[],
		options?: {
			itemPricing?: Record<string, MarketItemPricingInput | undefined>;
		}
	): ExpiringShareSnapshot {
		const expiringItems = filterItemsExpiringWithinDays(items, EXPIRING_SOON_DAYS);
		const snapshots: ExpiringShareItemSnapshot[] = expiringItems.map((item) => {
			const base: ExpiringShareItemSnapshot = {
				name: item.name,
				expiresOn: item.expiresOn,
				location: item.location,
				quantity: item.quantity,
				unit: item.unit
			};
			const pricingInput = options?.itemPricing?.[item.id];
			if (!pricingInput) {
				return base;
			}
			return applyPricingToItemSnapshot(
				base,
				resolveMarketItemPricing({
					...pricingInput,
					quantity: pricingInput.quantity ?? item.quantity
				})
			);
		});

		return {
			items: snapshots,
			createdAt: new Date().toISOString()
		};
	}

	async createShareLink(
		householdId: string,
		userId: string,
		items: InventoryItem[],
		options?: {
			attachNearby?: boolean;
			coordinate?: GeoCoordinate | null;
			sharerPlanTier?: PlanTier;
			sharerRole?: string | null;
		}
	): Promise<{
		shareId: string;
		token: string;
		urlPath: string;
		expiresAt: Date;
		itemCount: number;
	} | null> {
		const snapshot = this.buildSnapshot(items);
		if (snapshot.items.length === 0) {
			return null;
		}

		let geo: GeoCoordinate | null = null;
		if (options?.attachNearby) {
			const settings = await this.repository.getNearbySharingSettings(userId);
			if (settings.enabled) {
				const raw =
					options.coordinate ??
					(settings.latitude != null && settings.longitude != null
						? { latitude: settings.latitude, longitude: settings.longitude }
						: null);
				if (raw && isValidLatitude(raw.latitude) && isValidLongitude(raw.longitude)) {
					geo = coarseGeoCoordinate(raw);
				}
			}
		}

		const token = generateSecureToken();
		const tokenHash = hashSecureToken(token);
		const effectiveTier = resolveEffectivePlanTier(
			{ role: options?.sharerRole ?? null },
			options?.sharerPlanTier ?? 'free'
		);
		const ttlMs = isProTier(effectiveTier) ? EXPIRING_SHARE_PRO_TTL_MS : EXPIRING_SHARE_TTL_MS;
		const expiresAt = new Date(Date.now() + ttlMs);
		const id = crypto.randomUUID();

		await this.repository.create({
			id,
			householdId,
			createdByUserId: userId,
			tokenHash,
			snapshot,
			expiresAt,
			latitude: geo?.latitude ?? null,
			longitude: geo?.longitude ?? null
		});

		return {
			shareId: id,
			token,
			urlPath: `/dela/${token}`,
			expiresAt,
			itemCount: snapshot.items.length
		};
	}

	getSharePreview(token: string): Promise<ExpiringSharePreview | null> {
		return this.repository.findByTokenHash(hashSecureToken(token));
	}

	getNearbySharingSettings(userId: string): Promise<NearbySharingSettings> {
		return this.repository.getNearbySharingSettings(userId);
	}

	async updateNearbySharingSettings(
		userId: string,
		input: { enabled: boolean; coordinate?: GeoCoordinate | null }
	): Promise<NearbySharingSettings> {
		let latitude: number | null = null;
		let longitude: number | null = null;

		if (input.enabled) {
			if (
				input.coordinate &&
				isValidLatitude(input.coordinate.latitude) &&
				isValidLongitude(input.coordinate.longitude)
			) {
				const coarse = coarseGeoCoordinate(input.coordinate);
				latitude = coarse.latitude;
				longitude = coarse.longitude;
			} else {
				const existing = await this.repository.getNearbySharingSettings(userId);
				latitude = existing.latitude;
				longitude = existing.longitude;
			}
		}

		await this.repository.updateNearbySharingSettings(userId, {
			enabled: input.enabled,
			latitude,
			longitude
		});

		return this.repository.getNearbySharingSettings(userId);
	}

	async listNearbyShares(
		userId: string,
		householdId: string,
		options?: { viewerPlanTier?: PlanTier; viewerRole?: string | null }
	): Promise<{ optedIn: boolean; shares: NearbyExpiringShare[]; radiusM: number }> {
		const settings = await this.repository.getNearbySharingSettings(userId);
		const effectiveTier = resolveEffectivePlanTier(
			{ role: options?.viewerRole ?? null },
			options?.viewerPlanTier ?? 'free'
		);
		const radiusM = getNearbyRadiusM(effectiveTier);

		if (!settings.enabled || settings.latitude == null || settings.longitude == null) {
			return { optedIn: settings.enabled, shares: [], radiusM };
		}

		const [blockedShareIds, blockedHouseholdIds] = await Promise.all([
			this.repository.getBlockedShareIds(userId),
			this.repository.getBlockedHouseholdIds(userId)
		]);

		const center = { latitude: settings.latitude, longitude: settings.longitude };
		const bounds = geoBoundingBox(center, radiusM);
		const rows = await this.repository.findActiveSharesInBoundingBox(
			bounds,
			householdId,
			blockedShareIds,
			blockedHouseholdIds
		);

		const shares: NearbyExpiringShare[] = [];
		for (const row of rows) {
			const lat = parseNumeric(row.latitude);
			const lng = parseNumeric(row.longitude);
			if (lat == null || lng == null) {
				continue;
			}

			const distanceM = distanceMetres(center, { latitude: lat, longitude: lng });
			if (distanceM > radiusM) {
				continue;
			}

			let snapshot: ExpiringShareSnapshot;
			try {
				snapshot = JSON.parse(row.snapshotJson) as ExpiringShareSnapshot;
			} catch {
				continue;
			}

			if (snapshot.items.length === 0) {
				continue;
			}

			const jittered = jitterCoordinateForDisplay(row.id, { latitude: lat, longitude: lng });

			shares.push({
				id: row.id,
				itemCount: snapshot.items.length,
				previewItems: snapshot.items.slice(0, 3).map((item) => ({
					name: item.name,
					expiresOn: item.expiresOn,
					quantity: item.quantity,
					unit: item.unit,
					portionPercent: item.portionPercent,
					askingPriceSek: item.askingPriceSek,
					pricingMode: item.pricingMode
				})),
				approximateDistanceM: approximateDistanceMetres(distanceM),
				mapLat: jittered.latitude,
				mapLng: jittered.longitude,
				openPath: `/grannskafferiet/share/${row.id}`,
				expiresAt: row.expiresAt,
				createdAt: row.createdAt
			});
		}

		shares.sort((a, b) => a.approximateDistanceM - b.approximateDistanceM);
		return { optedIn: true, shares, radiusM };
	}

	async listExpiringShareReports(limit = 50) {
		return this.repository.listReports(limit);
	}

	async getNearbySharePreviewForViewer(
		userId: string,
		householdId: string,
		shareId: string,
		options?: { viewerPlanTier?: PlanTier; viewerRole?: string | null }
	): Promise<ExpiringSharePreview | null> {
		const nearby = await this.listNearbyShares(userId, householdId, options);
		if (!nearby.optedIn || !nearby.shares.some((share) => share.id === shareId)) {
			return null;
		}

		return this.repository.findPreviewById(shareId);
	}

	async reportShare(
		reporterUserId: string,
		input: ExpiringShareReportInput
	): Promise<{ ok: true; shareId: string; householdId: string } | { ok: false; error: string }> {
		let meta = input.shareId ? await this.repository.findMetaById(input.shareId) : null;
		if (!meta && input.token) {
			meta = await this.repository.findMetaByTokenHash(hashSecureToken(input.token));
		}

		if (!meta) {
			return { ok: false, error: 'not_found' };
		}

		await this.repository.createReport({
			id: crypto.randomUUID(),
			shareId: meta.id,
			reporterUserId,
			reason: input.reason ?? null
		});

		await this.repository.blockShareForReporter({
			id: crypto.randomUUID(),
			reporterUserId,
			shareId: meta.id
		});

		if (input.blockHousehold) {
			await this.repository.blockHouseholdForReporter({
				id: crypto.randomUUID(),
				reporterUserId,
				householdId: meta.householdId
			});
		}

		return { ok: true, shareId: meta.id, householdId: meta.householdId };
	}
}

function parseNumeric(value: string | null): number | null {
	if (value == null) {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}
