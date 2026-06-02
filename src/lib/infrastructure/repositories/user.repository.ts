import { eq } from 'drizzle-orm';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';
import type { SignupUtm } from '$lib/domain/signup-utm';
import type { ThemePreference } from '$lib/domain/theme';
import type { UserProfile } from '$lib/domain/user';

export interface IUserRepository {
	findByEmail(
		email: string
	): Promise<{ id: string; email: string; passwordHash: string | null; mustResetPassword: boolean } | null>;
	findById(id: string): Promise<{ id: string; email: string; passwordHash: string | null; mustResetPassword: boolean } | null>;
	create(
		email: string,
		passwordHash: string | null,
		id: string,
		signupUtm?: SignupUtm | null
	): Promise<{ id: string; email: string }>;
	createOAuthUser(
		email: string,
		id: string,
		profile?: { displayName?: string | null; avatarUrl?: string | null },
		signupUtm?: SignupUtm | null
	): Promise<{ id: string; email: string }>;
	updatePasswordHash(id: string, passwordHash: string): Promise<void>;
	setMustResetPassword(id: string, enabled: boolean): Promise<void>;
	findProfileById(id: string): Promise<UserProfile | null>;
	updateProfile(
		id: string,
		data: { displayName: string | null; avatarUrl: string | null }
	): Promise<UserProfile | null>;
	updateThemePreference(id: string, themePreference: ThemePreference): Promise<ThemePreference | null>;
}

function mapProfile(row: {
	id: string;
	email: string;
	displayName: string | null;
	avatarUrl: string | null;
}): UserProfile {
	return {
		id: row.id,
		email: row.email,
		displayName: row.displayName,
		avatarUrl: row.avatarUrl
	};
}

export class DrizzleUserRepository implements IUserRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async findByEmail(email: string) {
		const [row] = await this.db
			.select({
				id: userTable.id,
				email: userTable.email,
				passwordHash: userTable.passwordHash,
				mustResetPassword: userTable.mustResetPassword
			})
			.from(userTable)
			.where(eq(userTable.email, email.toLowerCase()))
			.limit(1);

		return row ?? null;
	}

	async findById(id: string) {
		const [row] = await this.db
			.select({
				id: userTable.id,
				email: userTable.email,
				passwordHash: userTable.passwordHash,
				mustResetPassword: userTable.mustResetPassword
			})
			.from(userTable)
			.where(eq(userTable.id, id))
			.limit(1);

		return row ?? null;
	}

	async create(email: string, passwordHash: string | null, id: string, signupUtm?: SignupUtm | null) {
		const normalizedEmail = email.toLowerCase();
		await this.db.insert(userTable).values({
			id,
			email: normalizedEmail,
			passwordHash,
			signupUtmSource: signupUtm?.source ?? null,
			signupUtmMedium: signupUtm?.medium ?? null,
			signupUtmCampaign: signupUtm?.campaign ?? null,
			signupUtmContent: signupUtm?.content ?? null
		});

		return { id, email: normalizedEmail };
	}

	async createOAuthUser(
		email: string,
		id: string,
		profile?: { displayName?: string | null; avatarUrl?: string | null },
		signupUtm?: SignupUtm | null
	) {
		const normalizedEmail = email.toLowerCase();
		await this.db.insert(userTable).values({
			id,
			email: normalizedEmail,
			passwordHash: null,
			displayName: profile?.displayName ?? null,
			avatarUrl: profile?.avatarUrl ?? null,
			signupUtmSource: signupUtm?.source ?? null,
			signupUtmMedium: signupUtm?.medium ?? null,
			signupUtmCampaign: signupUtm?.campaign ?? null,
			signupUtmContent: signupUtm?.content ?? null
		});

		return { id, email: normalizedEmail };
	}

	async updatePasswordHash(id: string, passwordHash: string) {
		await this.db
			.update(userTable)
			.set({ passwordHash, mustResetPassword: false })
			.where(eq(userTable.id, id));
	}

	async setMustResetPassword(id: string, enabled: boolean) {
		await this.db.update(userTable).set({ mustResetPassword: enabled }).where(eq(userTable.id, id));
	}

	async findProfileById(id: string) {
		const [row] = await this.db
			.select({
				id: userTable.id,
				email: userTable.email,
				displayName: userTable.displayName,
				avatarUrl: userTable.avatarUrl
			})
			.from(userTable)
			.where(eq(userTable.id, id))
			.limit(1);

		return row ? mapProfile(row) : null;
	}

	async updateProfile(
		id: string,
		data: { displayName: string | null; avatarUrl: string | null }
	) {
		const [row] = await this.db
			.update(userTable)
			.set({
				displayName: data.displayName,
				avatarUrl: data.avatarUrl
			})
			.where(eq(userTable.id, id))
			.returning();

		return row ? mapProfile(row) : null;
	}

	async updateThemePreference(id: string, themePreference: ThemePreference) {
		const [row] = await this.db
			.update(userTable)
			.set({ themePreference })
			.where(eq(userTable.id, id))
			.returning();

		return row?.themePreference ?? null;
	}
}