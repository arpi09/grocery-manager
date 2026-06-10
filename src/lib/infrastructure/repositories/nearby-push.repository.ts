import { and, eq, isNotNull, ne, sql } from 'drizzle-orm';
import type { PlanTier } from '$lib/domain/plan';
import { geoBoundingBox, type GeoCoordinate } from '$lib/domain/geo';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { householdTable, userTable } from '$lib/infrastructure/db/schema';

export interface NearbyPushSettings {
	enabled: boolean;
	lastSentAt: Date | null;
}

export interface NearbyPushViewer {
	id: string;
	role: string;
	planTier: PlanTier;
	settings: NearbyPushSettings;
	pushNotificationsEnabled: boolean;
	nearbySharingEnabled: boolean;
	latitude: number;
	longitude: number;
}

export interface INearbyPushRepository {
	getSettings(userId: string): Promise<NearbyPushSettings>;
	updateSettings(userId: string, enabled: boolean): Promise<void>;
	markPushSent(userId: string, sentAt?: Date): Promise<void>;
	listOptedInViewersNear(
		center: GeoCoordinate,
		radiusM: number,
		excludeUserId: string
	): Promise<NearbyPushViewer[]>;
}

function parseNumeric(value: string | null): number | null {
	if (value == null) {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export class DrizzleNearbyPushRepository implements INearbyPushRepository {
	constructor(private readonly database: AppDatabase = defaultDb) {}

	async getSettings(userId: string): Promise<NearbyPushSettings> {
		const [row] = await this.database
			.select({
				nearbyPushEnabled: userTable.nearbyPushEnabled,
				nearbyPushLastSentAt: userTable.nearbyPushLastSentAt
			})
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		if (!row) {
			return { enabled: false, lastSentAt: null };
		}

		return {
			enabled: row.nearbyPushEnabled,
			lastSentAt: row.nearbyPushLastSentAt
		};
	}

	async updateSettings(userId: string, enabled: boolean): Promise<void> {
		await this.database
			.update(userTable)
			.set({ nearbyPushEnabled: enabled })
			.where(eq(userTable.id, userId));
	}

	async markPushSent(userId: string, sentAt = new Date()): Promise<void> {
		await this.database
			.update(userTable)
			.set({ nearbyPushLastSentAt: sentAt })
			.where(eq(userTable.id, userId));
	}

	async listOptedInViewersNear(
		center: GeoCoordinate,
		radiusM: number,
		excludeUserId: string
	): Promise<NearbyPushViewer[]> {
		const bounds = geoBoundingBox(center, radiusM);

		const rows = await this.database
			.select({
				id: userTable.id,
				role: userTable.role,
				nearbyPushEnabled: userTable.nearbyPushEnabled,
				nearbyPushLastSentAt: userTable.nearbyPushLastSentAt,
				pushNotificationsEnabled: userTable.pushNotificationsEnabled,
				nearbySharingEnabled: userTable.nearbySharingEnabled,
				latitude: userTable.nearbySharingLat,
				longitude: userTable.nearbySharingLng,
				planTier: householdTable.planTier
			})
			.from(userTable)
			.leftJoin(householdTable, eq(householdTable.id, userTable.activeHouseholdId))
			.where(
				and(
					eq(userTable.nearbyPushEnabled, true),
					eq(userTable.pushNotificationsEnabled, true),
					eq(userTable.nearbySharingEnabled, true),
					isNotNull(userTable.nearbySharingLat),
					isNotNull(userTable.nearbySharingLng),
					ne(userTable.id, excludeUserId),
					sql`${userTable.nearbySharingLat}::float >= ${bounds.minLat}`,
					sql`${userTable.nearbySharingLat}::float <= ${bounds.maxLat}`,
					sql`${userTable.nearbySharingLng}::float >= ${bounds.minLng}`,
					sql`${userTable.nearbySharingLng}::float <= ${bounds.maxLng}`
				)
			);

		const viewers: NearbyPushViewer[] = [];
		for (const row of rows) {
			const latitude = parseNumeric(row.latitude);
			const longitude = parseNumeric(row.longitude);
			if (latitude == null || longitude == null) {
				continue;
			}

			viewers.push({
				id: row.id,
				role: row.role,
				planTier: row.planTier ?? 'free',
				settings: {
					enabled: row.nearbyPushEnabled,
					lastSentAt: row.nearbyPushLastSentAt
				},
				pushNotificationsEnabled: row.pushNotificationsEnabled,
				nearbySharingEnabled: row.nearbySharingEnabled,
				latitude,
				longitude
			});
		}

		return viewers;
	}
}
