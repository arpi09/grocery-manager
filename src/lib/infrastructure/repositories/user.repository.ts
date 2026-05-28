import { eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';

export interface IUserRepository {
	findByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string } | null>;
	create(email: string, passwordHash: string, id: string): Promise<{ id: string; email: string }>;
}

export class DrizzleUserRepository implements IUserRepository {
	async findByEmail(email: string) {
		const [row] = await db
			.select({
				id: userTable.id,
				email: userTable.email,
				passwordHash: userTable.passwordHash
			})
			.from(userTable)
			.where(eq(userTable.email, email.toLowerCase()))
			.limit(1);

		return row ?? null;
	}

	async create(email: string, passwordHash: string, id: string) {
		const normalizedEmail = email.toLowerCase();
		await db.insert(userTable).values({
			id,
			email: normalizedEmail,
			passwordHash
		});

		return { id, email: normalizedEmail };
	}
}
