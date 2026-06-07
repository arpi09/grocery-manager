import { eq } from 'drizzle-orm';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { householdReceiptForwardTokenTable, householdTable } from '$lib/infrastructure/db/schema';

export interface ReceiptForwardTokenRow {
	householdId: string;
	tokenHash: string;
}

export interface IReceiptForwardRepository {
	findByTokenHash(tokenHash: string): Promise<ReceiptForwardTokenRow | null>;
	findByHouseholdId(householdId: string): Promise<ReceiptForwardTokenRow | null>;
	listHouseholdIds(): Promise<string[]>;
	upsertToken(id: string, householdId: string, tokenHash: string): Promise<void>;
}

export class DrizzleReceiptForwardRepository implements IReceiptForwardRepository {
	constructor(private readonly database: AppDatabase = defaultDb) {}

	async findByTokenHash(tokenHash: string): Promise<ReceiptForwardTokenRow | null> {
		const [row] = await this.database
			.select({
				householdId: householdReceiptForwardTokenTable.householdId,
				tokenHash: householdReceiptForwardTokenTable.tokenHash
			})
			.from(householdReceiptForwardTokenTable)
			.where(eq(householdReceiptForwardTokenTable.tokenHash, tokenHash))
			.limit(1);

		return row ?? null;
	}

	async findByHouseholdId(householdId: string): Promise<ReceiptForwardTokenRow | null> {
		const [row] = await this.database
			.select({
				householdId: householdReceiptForwardTokenTable.householdId,
				tokenHash: householdReceiptForwardTokenTable.tokenHash
			})
			.from(householdReceiptForwardTokenTable)
			.where(eq(householdReceiptForwardTokenTable.householdId, householdId))
			.limit(1);

		return row ?? null;
	}

	async listHouseholdIds(): Promise<string[]> {
		const rows = await this.database.select({ id: householdTable.id }).from(householdTable);
		return rows.map((row) => row.id);
	}

	async upsertToken(id: string, householdId: string, tokenHash: string): Promise<void> {
		const existing = await this.findByHouseholdId(householdId);
		if (existing) {
			return;
		}

		await this.database.insert(householdReceiptForwardTokenTable).values({
			id,
			householdId,
			tokenHash,
			createdAt: new Date()
		});
	}
}
