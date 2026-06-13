import { and, eq, gt, isNull } from 'drizzle-orm';
import type {
	ShoppingListSharePreview,
	ShoppingListShareSnapshot
} from '$lib/domain/shopping-list-share';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { shoppingListShareLinkTable } from '$lib/infrastructure/db/schema';

export interface CreateShoppingListShareInput {
	id: string;
	householdId: string;
	createdByUserId: string;
	tokenHash: string;
	snapshot: ShoppingListShareSnapshot;
	expiresAt: Date;
}

export interface IShoppingListShareRepository {
	revokeActiveByHousehold(householdId: string): Promise<void>;
	create(input: CreateShoppingListShareInput): Promise<void>;
	findByTokenHash(tokenHash: string): Promise<ShoppingListSharePreview | null>;
	findHouseholdIdByTokenHash(tokenHash: string): Promise<string | null>;
}

export class DrizzleShoppingListShareRepository implements IShoppingListShareRepository {
	constructor(private readonly database: AppDatabase = defaultDb) {}

	async revokeActiveByHousehold(householdId: string): Promise<void> {
		await this.database
			.update(shoppingListShareLinkTable)
			.set({ revokedAt: new Date() })
			.where(
				and(
					eq(shoppingListShareLinkTable.householdId, householdId),
					isNull(shoppingListShareLinkTable.revokedAt),
					gt(shoppingListShareLinkTable.expiresAt, new Date())
				)
			);
	}

	async create(input: CreateShoppingListShareInput): Promise<void> {
		await this.database.insert(shoppingListShareLinkTable).values({
			id: input.id,
			householdId: input.householdId,
			createdByUserId: input.createdByUserId,
			tokenHash: input.tokenHash,
			snapshotJson: JSON.stringify(input.snapshot),
			expiresAt: input.expiresAt,
			createdAt: new Date(),
			revokedAt: null
		});
	}

	async findByTokenHash(tokenHash: string): Promise<ShoppingListSharePreview | null> {
		const rows = await this.database
			.select({
				snapshotJson: shoppingListShareLinkTable.snapshotJson,
				expiresAt: shoppingListShareLinkTable.expiresAt,
				createdAt: shoppingListShareLinkTable.createdAt,
				revokedAt: shoppingListShareLinkTable.revokedAt
			})
			.from(shoppingListShareLinkTable)
			.where(eq(shoppingListShareLinkTable.tokenHash, tokenHash))
			.limit(1);

		return this.toPreview(rows[0]);
	}

	async findHouseholdIdByTokenHash(tokenHash: string): Promise<string | null> {
		const rows = await this.database
			.select({
				householdId: shoppingListShareLinkTable.householdId,
				expiresAt: shoppingListShareLinkTable.expiresAt,
				revokedAt: shoppingListShareLinkTable.revokedAt
			})
			.from(shoppingListShareLinkTable)
			.where(eq(shoppingListShareLinkTable.tokenHash, tokenHash))
			.limit(1);

		const row = rows[0];
		if (!row || row.revokedAt != null || row.expiresAt.getTime() <= Date.now()) {
			return null;
		}

		return row.householdId;
	}

	private toPreview(
		row:
			| {
					snapshotJson: string;
					expiresAt: Date;
					createdAt: Date;
					revokedAt: Date | null;
			  }
			| undefined
	): ShoppingListSharePreview | null {
		if (!row || row.revokedAt != null || row.expiresAt.getTime() <= Date.now()) {
			return null;
		}

		let snapshot: ShoppingListShareSnapshot;
		try {
			snapshot = JSON.parse(row.snapshotJson) as ShoppingListShareSnapshot;
		} catch {
			return null;
		}

		return {
			title: snapshot.title,
			items: snapshot.items,
			snapshotAt: snapshot.snapshotAt,
			expiresAt: row.expiresAt,
			createdAt: row.createdAt
		};
	}
}
