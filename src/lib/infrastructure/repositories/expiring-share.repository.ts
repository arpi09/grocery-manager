import { and, desc, eq, gt, isNotNull, ne, sql } from 'drizzle-orm';
import type {
	ExpiringSharePreview,
	ExpiringShareSnapshot,
	NearbySharingSettings
} from '$lib/domain/expiring-share';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import {
	expiringShareBlockTable,
	expiringShareLinkTable,
	expiringShareReportTable,
	userTable
} from '$lib/infrastructure/db/schema';

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
	householdId: string;
	snapshotJson: string;
	expiresAt: Date;
	createdAt: Date;
	latitude: string | null;
	longitude: string | null;
}

/** Public city feed row — no household or exact coordinates. */
export interface PublicGeoShareRow {
	id: string;
	snapshotJson: string;
	expiresAt: Date;
	createdAt: Date;
}

export interface ExpiringShareMeta {
	id: string;
	householdId: string;
	expiresAt: Date;
}

export interface ExpiringShareForNearbyPush {
	id: string;
	householdId: string;
	createdByUserId: string;
	latitude: number | null;
	longitude: number | null;
	snapshot: ExpiringShareSnapshot;
	expiresAt: Date;
}

export interface ExpiringShareReportRow {
	id: string;
	shareId: string;
	reporterUserId: string;
	reason: string | null;
	createdAt: Date;
}

export interface IExpiringShareRepository {
	create(input: CreateExpiringShareInput): Promise<void>;
	findByTokenHash(tokenHash: string): Promise<ExpiringSharePreview | null>;
	findMetaByTokenHash(tokenHash: string): Promise<ExpiringShareMeta | null>;
	findMetaById(shareId: string): Promise<ExpiringShareMeta | null>;
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
		excludeHouseholdId: string,
		excludeShareIds?: string[],
		excludeHouseholdIds?: string[]
	): Promise<NearbyShareRow[]>;
	findActiveGeoSharesInBoundingBox(bounds: {
		minLat: number;
		maxLat: number;
		minLng: number;
		maxLng: number;
	}): Promise<PublicGeoShareRow[]>;
	createReport(input: {
		id: string;
		shareId: string;
		reporterUserId: string;
		reason: string | null;
	}): Promise<void>;
	blockShareForReporter(input: { id: string; reporterUserId: string; shareId: string }): Promise<void>;
	blockHouseholdForReporter(input: {
		id: string;
		reporterUserId: string;
		householdId: string;
	}): Promise<void>;
	getBlockedShareIds(reporterUserId: string): Promise<string[]>;
	getBlockedHouseholdIds(reporterUserId: string): Promise<string[]>;
	findPreviewById(shareId: string): Promise<ExpiringSharePreview | null>;
	findShareForNearbyPush(shareId: string): Promise<ExpiringShareForNearbyPush | null>;
	listReports(limit: number): Promise<ExpiringShareReportRow[]>;
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

		return this.toPreview(rows[0]);
	}

	async findMetaByTokenHash(tokenHash: string): Promise<ExpiringShareMeta | null> {
		const rows = await this.database
			.select({
				id: expiringShareLinkTable.id,
				householdId: expiringShareLinkTable.householdId,
				expiresAt: expiringShareLinkTable.expiresAt
			})
			.from(expiringShareLinkTable)
			.where(eq(expiringShareLinkTable.tokenHash, tokenHash))
			.limit(1);

		const row = rows[0];
		if (!row || row.expiresAt.getTime() <= Date.now()) {
			return null;
		}

		return row;
	}

	async findMetaById(shareId: string): Promise<ExpiringShareMeta | null> {
		const rows = await this.database
			.select({
				id: expiringShareLinkTable.id,
				householdId: expiringShareLinkTable.householdId,
				expiresAt: expiringShareLinkTable.expiresAt
			})
			.from(expiringShareLinkTable)
			.where(eq(expiringShareLinkTable.id, shareId))
			.limit(1);

		const row = rows[0];
		if (!row || row.expiresAt.getTime() <= Date.now()) {
			return null;
		}

		return row;
	}

	async findPreviewById(shareId: string): Promise<ExpiringSharePreview | null> {
		const rows = await this.database
			.select({
				snapshotJson: expiringShareLinkTable.snapshotJson,
				expiresAt: expiringShareLinkTable.expiresAt,
				createdAt: expiringShareLinkTable.createdAt
			})
			.from(expiringShareLinkTable)
			.where(eq(expiringShareLinkTable.id, shareId))
			.limit(1);

		return this.toPreview(rows[0]);
	}

	async findShareForNearbyPush(shareId: string): Promise<ExpiringShareForNearbyPush | null> {
		const rows = await this.database
			.select({
				id: expiringShareLinkTable.id,
				householdId: expiringShareLinkTable.householdId,
				createdByUserId: expiringShareLinkTable.createdByUserId,
				snapshotJson: expiringShareLinkTable.snapshotJson,
				expiresAt: expiringShareLinkTable.expiresAt,
				latitude: expiringShareLinkTable.latitude,
				longitude: expiringShareLinkTable.longitude
			})
			.from(expiringShareLinkTable)
			.where(eq(expiringShareLinkTable.id, shareId))
			.limit(1);

		const row = rows[0];
		if (!row || row.expiresAt.getTime() <= Date.now()) {
			return null;
		}

		let snapshot: ExpiringShareSnapshot;
		try {
			snapshot = JSON.parse(row.snapshotJson) as ExpiringShareSnapshot;
		} catch {
			return null;
		}

		return {
			id: row.id,
			householdId: row.householdId,
			createdByUserId: row.createdByUserId,
			latitude: parseNumeric(row.latitude),
			longitude: parseNumeric(row.longitude),
			snapshot,
			expiresAt: row.expiresAt
		};
	}

	async listReports(limit: number): Promise<ExpiringShareReportRow[]> {
		return this.database
			.select({
				id: expiringShareReportTable.id,
				shareId: expiringShareReportTable.shareId,
				reporterUserId: expiringShareReportTable.reporterUserId,
				reason: expiringShareReportTable.reason,
				createdAt: expiringShareReportTable.createdAt
			})
			.from(expiringShareReportTable)
			.orderBy(desc(expiringShareReportTable.createdAt))
			.limit(limit);
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
		excludeHouseholdId: string,
		excludeShareIds: string[] = [],
		excludeHouseholdIds: string[] = []
	): Promise<NearbyShareRow[]> {
		const filters = [
			gt(expiringShareLinkTable.expiresAt, sql`now()`),
			isNotNull(expiringShareLinkTable.latitude),
			isNotNull(expiringShareLinkTable.longitude),
			sql`${expiringShareLinkTable.latitude}::float >= ${bounds.minLat}`,
			sql`${expiringShareLinkTable.latitude}::float <= ${bounds.maxLat}`,
			sql`${expiringShareLinkTable.longitude}::float >= ${bounds.minLng}`,
			sql`${expiringShareLinkTable.longitude}::float <= ${bounds.maxLng}`
		];

		if (excludeHouseholdId) {
			filters.push(ne(expiringShareLinkTable.householdId, excludeHouseholdId));
		}

		if (excludeShareIds.length > 0) {
			filters.push(sql`${expiringShareLinkTable.id} NOT IN (${sql.join(
				excludeShareIds.map((id) => sql`${id}`),
				sql`, `
			)})`);
		}

		if (excludeHouseholdIds.length > 0) {
			filters.push(sql`${expiringShareLinkTable.householdId} NOT IN (${sql.join(
				excludeHouseholdIds.map((id) => sql`${id}`),
				sql`, `
			)})`);
		}

		return this.database
			.select({
				id: expiringShareLinkTable.id,
				householdId: expiringShareLinkTable.householdId,
				snapshotJson: expiringShareLinkTable.snapshotJson,
				expiresAt: expiringShareLinkTable.expiresAt,
				createdAt: expiringShareLinkTable.createdAt,
				latitude: expiringShareLinkTable.latitude,
				longitude: expiringShareLinkTable.longitude
			})
			.from(expiringShareLinkTable)
			.where(and(...filters));
	}

	async findActiveGeoSharesInBoundingBox(bounds: {
		minLat: number;
		maxLat: number;
		minLng: number;
		maxLng: number;
	}): Promise<PublicGeoShareRow[]> {
		return this.database
			.select({
				id: expiringShareLinkTable.id,
				snapshotJson: expiringShareLinkTable.snapshotJson,
				expiresAt: expiringShareLinkTable.expiresAt,
				createdAt: expiringShareLinkTable.createdAt
			})
			.from(expiringShareLinkTable)
			.where(
				and(
					gt(expiringShareLinkTable.expiresAt, sql`now()`),
					isNotNull(expiringShareLinkTable.latitude),
					isNotNull(expiringShareLinkTable.longitude),
					sql`${expiringShareLinkTable.latitude}::float >= ${bounds.minLat}`,
					sql`${expiringShareLinkTable.latitude}::float <= ${bounds.maxLat}`,
					sql`${expiringShareLinkTable.longitude}::float >= ${bounds.minLng}`,
					sql`${expiringShareLinkTable.longitude}::float <= ${bounds.maxLng}`
				)
			);
	}

	async createReport(input: {
		id: string;
		shareId: string;
		reporterUserId: string;
		reason: string | null;
	}): Promise<void> {
		await this.database.insert(expiringShareReportTable).values({
			id: input.id,
			shareId: input.shareId,
			reporterUserId: input.reporterUserId,
			reason: input.reason
		});
	}

	async blockShareForReporter(input: {
		id: string;
		reporterUserId: string;
		shareId: string;
	}): Promise<void> {
		const existing = await this.database
			.select({ id: expiringShareBlockTable.id })
			.from(expiringShareBlockTable)
			.where(
				and(
					eq(expiringShareBlockTable.reporterUserId, input.reporterUserId),
					eq(expiringShareBlockTable.shareId, input.shareId)
				)
			)
			.limit(1);

		if (existing[0]) {
			return;
		}

		await this.database.insert(expiringShareBlockTable).values({
			id: input.id,
			reporterUserId: input.reporterUserId,
			shareId: input.shareId,
			householdId: null
		});
	}

	async blockHouseholdForReporter(input: {
		id: string;
		reporterUserId: string;
		householdId: string;
	}): Promise<void> {
		const existing = await this.database
			.select({ id: expiringShareBlockTable.id })
			.from(expiringShareBlockTable)
			.where(
				and(
					eq(expiringShareBlockTable.reporterUserId, input.reporterUserId),
					eq(expiringShareBlockTable.householdId, input.householdId)
				)
			)
			.limit(1);

		if (existing[0]) {
			return;
		}

		await this.database.insert(expiringShareBlockTable).values({
			id: input.id,
			reporterUserId: input.reporterUserId,
			shareId: null,
			householdId: input.householdId
		});
	}

	async getBlockedShareIds(reporterUserId: string): Promise<string[]> {
		const rows = await this.database
			.select({ shareId: expiringShareBlockTable.shareId })
			.from(expiringShareBlockTable)
			.where(
				and(
					eq(expiringShareBlockTable.reporterUserId, reporterUserId),
					isNotNull(expiringShareBlockTable.shareId)
				)
			);

		return rows.map((row) => row.shareId!).filter(Boolean);
	}

	async getBlockedHouseholdIds(reporterUserId: string): Promise<string[]> {
		const rows = await this.database
			.select({ householdId: expiringShareBlockTable.householdId })
			.from(expiringShareBlockTable)
			.where(
				and(
					eq(expiringShareBlockTable.reporterUserId, reporterUserId),
					isNotNull(expiringShareBlockTable.householdId)
				)
			);

		return rows.map((row) => row.householdId!).filter(Boolean);
	}

	private toPreview(
		row:
			| {
					snapshotJson: string;
					expiresAt: Date;
					createdAt: Date;
			  }
			| undefined
	): ExpiringSharePreview | null {
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
}
