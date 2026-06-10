import { and, eq, gt, isNotNull, ne, sql } from 'drizzle-orm';
import type {
	ExpiringSharePreview,
	ExpiringShareSnapshot,
	NearbySharingSettings
} from '$lib/domain/expiring-share';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { expiringShareLinkTable, userTable } from '$lib/infrastructure/db/schema';

export interface CreateExpiringShareInput {
	id: string;
	householdId: string;
	createdByUserId: string;
	tokenHash: string;
	snapshot: ExpiringShareSnapshot;
	expiresAt: Date;
	latitude?: number | null;
	longitude?: number | null;
}

export interface NearbyShareRow {
	id: string;
	snapshotJson: string;
	expiresAt: Date;
	createdAt: Date;
	latitude: string | null;
	longitude: string | null;
}

export interface IExpiringShareRepository {
	create(input: CreateExpiringShareInput): Promise<void>;
	findByTokenHash(tokenHash: string): Promise<ExpiringSharePreview | null>;
	getNearbySharingSettings(userId: string): Promise<NearbySharingSettings>;
	updateNearbySharingSettings(
		userId: string,
		settings: {
			enabled: boolean;
			latitude: number | null;
			longitude: number | null;
		}
	): Promise<void>;
	findActiveSharesInBoundingBox(
		bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
		excludeHouseholdId: string
	): Promise<NearbyShareRow[]>;
}

function parseNumeric(value: string | null): number | null {
	if (value == null) {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export class DrizzleExpiringShareRepository implements IExpiringShareRepository {
	constructor(private readonly database: AppDatabase = defaultDb) {}

	async create(input: CreateExpiringShareInput): Promise<void> {
		await this.database.insert(expiringShareLinkTable).values({
			id: input.id,
			householdId: input.householdId,
			createdByUserId: input.createdByUserId,
			tokenHash: input.tokenHash,
			snapshotJson: JSON.stringify(input.snapshot),
			expiresAt: input.expiresAt,
			latitude: input.latitude != null ? String(input.latitude) : null,
			longitude: input.longitude != null ? String(input.longitude) : null,
			createdAt: new Date()
		});
	}

	async findByTokenHash(tokenHash: string): Promise<ExpiringSharePreview | null> {
		const rows = await this.database
			.select({
				snapshotJson: expiringShareLinkTable.snapshotJson,
				expiresAt: expiringShareLinkTable.expiresAt,
				createdAt: expiringShareLinkTable.createdAt
			})
			.from(expiringShareLinkTable)
			.where(eq(expiringShareLinkTable.tokenHash, tokenHash))
			.limit(1);

		const row = rows[0];
		if (!row) {
			return null;
		}

		if (row.expiresAt.getTime() <= Date.now()) {
			return null;
		}

		let snapshot: ExpiringShareSnapshot;
		try {
			snapshot = JSON.parse(row.snapshotJson) as ExpiringShareSnapshot;
		} catch {
			return null;
		}

		return {
			items: snapshot.items,
			expiresAt: row.expiresAt,
			createdAt: row.createdAt
		};
	}

	async getNearbySharingSettings(userId: string): Promise<NearbySharingSettings> {
		const rows = await this.database
			.select({
				enabled: userTable.nearbySharingEnabled,
				latitude: userTable.nearbySharingLat,
				longitude: userTable.nearbySharingLng,
				updatedAt: userTable.nearbySharingUpdatedAt
			})
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		const row = rows[0];
		if (!row) {
			return { enabled: false, latitude: null, longitude: null, updatedAt: null };
		}

		return {
			enabled: row.enabled,
			latitude: parseNumeric(row.latitude),
			longitude: parseNumeric(row.longitude),
			updatedAt: row.updatedAt ?? null
		};
	}

	async updateNearbySharingSettings(
		userId: string,
		settings: {
			enabled: boolean;
			latitude: number | null;
			longitude: number | null;
		}
	): Promise<void> {
		await this.database
			.update(userTable)
			.set({
				nearbySharingEnabled: settings.enabled,
				nearbySharingLat: settings.latitude != null ? String(settings.latitude) : null,
				nearbySharingLng: settings.longitude != null ? String(settings.longitude) : null,
				nearbySharingUpdatedAt: new Date()
			})
			.where(eq(userTable.id, userId));
	}

	async findActiveSharesInBoundingBox(
		bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
		excludeHouseholdId: string
	): Promise<NearbyShareRow[]> {
		return this.database
			.select({
				id: expiringShareLinkTable.id,
				snapshotJson: expiringShareLinkTable.snapshotJson,
				expiresAt: expiringShareLinkTable.expiresAt,
				createdAt: expiringShareLinkTable.createdAt,
				latitude: expiringShareLinkTable.latitude,
				longitude: expiringShareLinkTable.longitude
			})
			.from(expiringShareLinkTable)
			.where(
				and(
					gt(expiringShareLinkTable.expiresAt, sql`now()`),
					isNotNull(expiringShareLinkTable.latitude),
					isNotNull(expiringShareLinkTable.longitude),
					ne(expiringShareLinkTable.householdId, excludeHouseholdId),
					sql`${expiringShareLinkTable.latitude}::float >= ${bounds.minLat}`,
					sql`${expiringShareLinkTable.latitude}::float <= ${bounds.maxLat}`,
					sql`${expiringShareLinkTable.longitude}::float >= ${bounds.minLng}`,
					sql`${expiringShareLinkTable.longitude}::float <= ${bounds.maxLng}`
				)
			);
	}
}
