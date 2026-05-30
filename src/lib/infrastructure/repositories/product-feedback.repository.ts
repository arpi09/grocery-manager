import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { productFeedbackTable, userTable } from '$lib/infrastructure/db/schema';
import { generateId } from '$lib/infrastructure/auth/id';
import type {
	ProductFeedbackEntry,
	SubmitProductFeedbackInput
} from '$lib/domain/product-feedback';

export interface IProductFeedbackRepository {
	submit(input: SubmitProductFeedbackInput): Promise<string>;
	listRecent(limit: number): Promise<ProductFeedbackEntry[]>;
}

export class DrizzleProductFeedbackRepository implements IProductFeedbackRepository {
	async submit(input: SubmitProductFeedbackInput): Promise<string> {
		const id = generateId();
		await db.insert(productFeedbackTable).values({
			id,
			userId: input.userId,
			householdId: input.householdId,
			source: input.source,
			churnReason: input.churnReason,
			message: input.message
		});
		return id;
	}

	async listRecent(limit: number): Promise<ProductFeedbackEntry[]> {
		const rows = await db
			.select({
				id: productFeedbackTable.id,
				userId: productFeedbackTable.userId,
				userEmail: userTable.email,
				householdId: productFeedbackTable.householdId,
				source: productFeedbackTable.source,
				churnReason: productFeedbackTable.churnReason,
				message: productFeedbackTable.message,
				createdAt: productFeedbackTable.createdAt
			})
			.from(productFeedbackTable)
			.innerJoin(userTable, eq(productFeedbackTable.userId, userTable.id))
			.orderBy(desc(productFeedbackTable.createdAt))
			.limit(limit);

		return rows.map((row) => ({
			id: row.id,
			userId: row.userId,
			userEmail: row.userEmail,
			householdId: row.householdId,
			source: row.source as ProductFeedbackEntry['source'],
			churnReason: row.churnReason as ProductFeedbackEntry['churnReason'],
			message: row.message,
			createdAt: row.createdAt
		}));
	}
}
