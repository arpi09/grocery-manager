import { eq } from 'drizzle-orm';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';
import type { SignupUtm } from '$lib/domain/signup-utm';
import type { ShoppingToPantryMode } from '$lib/domain/shopping-to-pantry';
import type { ThemePreference } from '$lib/domain/theme';
import type { UserProfile } from '$lib/domain/user';

export interface UserAuthRow {
	id: string;
	email: string;
	passwordHash: string | null;
	mustResetPassword: boolean;
	emailVerifiedAt: Date | null;
}

export interface IUserRepository {
	findByEmail(email: string): Promise<UserAuthRow | null>;
	findById(id: string): Promise<UserAuthRow | null>;
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
	markEmailVerified(id: string): Promise<void>;
	updatePasswordHash(id: string, passwordHash: string): Promise<void>;
	setMustResetPassword(id: string, enabled: boolean): Promise<void>;
	findProfileById(id: string): Promise<UserProfile | null>;
	updateProfile(
		id: string,
		data: { displayName: string | null; avatarUrl: string | null }
	): Promise<UserProfile | null>;
	updateThemePreference(id: string, themePreference: ThemePreference): Promise<ThemePreference | null>;
	getShoppingToPantryMode(id: string): Promise<ShoppingToPantryMode | null>;
	updateShoppingToPantryMode(
		id: string,
		mode: ShoppingToPantryMode
	): Promise<ShoppingToPantryMode | null>;
	deleteUser(id: string): Promise<boolean>;
	getAutoNearbyListingEnabled(userId: string): Promise<boolean>;
	updateAutoNearbyListingEnabled(userId: string, enabled: boolean): Promise<boolean>;
	listUsersWithAutoNearbyListingEnabled(): Promise<Array<{ id: string }>>;
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

const authSelect = {
	id: userTable.id,
	email: userTable.email,
	passwordHash: userTable.passwordHash,
	mustResetPassword: userTable.mustResetPassword,
	emailVerifiedAt: userTable.emailVerifiedAt
};

export class DrizzleUserRepository implements IUserRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async findByEmail(email: string) {
		const [row] = await this.db
			.select(authSelect)
			.from(userTable)
			.where(eq(userTable.email, email.toLowerCase()))
			.limit(1);

		return row ?? null;
	}

	async findById(id: string) {
		const [row] = await this.db.select(authSelect).from(userTable).where(eq(userTable.id, id)).limit(1);

		return row ?? null;
	}

	async create(email: string, passwordHash: string | null, id: string, signupUtm?: SignupUtm | null) {
		const normalizedEmail = email.toLowerCase();
		await this.db.insert(userTable).values({
			id,
			email: normalizedEmail,
			passwordHash,
			themePreference: 'light',
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
			emailVerifiedAt: new Date(),
			displayName: profile?.displayName ?? null,
			avatarUrl: profile?.avatarUrl ?? null,
			themePreference: 'light',
			signupUtmSource: signupUtm?.source ?? null,
			signupUtmMedium: signupUtm?.medium ?? null,
			signupUtmCampaign: signupUtm?.campaign ?? null,
			signupUtmContent: signupUtm?.content ?? null
		});

		return { id, email: normalizedEmail };
	}

	async markEmailVerified(id: string) {
		await this.db.update(userTable).set({ emailVerifiedAt: new Date() }).where(eq(userTable.id, id));
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

	async updateProfile(id: string, data: { displayName: string | null; avatarUrl: string | null }) {
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

	async getShoppingToPantryMode(id: string) {
		const [row] = await this.db
			.select({ shoppingToPantryMode: userTable.shoppingToPantryMode })
			.from(userTable)
			.where(eq(userTable.id, id))
			.limit(1);

		return row?.shoppingToPantryMode ?? null;
	}

	async updateShoppingToPantryMode(id: string, mode: ShoppingToPantryMode) {
		const [row] = await this.db
			.update(userTable)
			.set({ shoppingToPantryMode: mode })
			.where(eq(userTable.id, id))
			.returning();

		return row?.shoppingToPantryMode ?? null;
	}

	async deleteUser(id: string) {
		const rows = await this.db.delete(userTable).where(eq(userTable.id, id)).returning();
		return rows.length > 0;
	}

	async getAutoNearbyListingEnabled(userId: string): Promise<boolean> {
		const [row] = await this.db
			.select({ enabled: userTable.autoNearbyListingEnabled })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		return row?.enabled ?? false;
	}

	async updateAutoNearbyListingEnabled(userId: string, enabled: boolean): Promise<boolean> {
		const rows = await this.db
			.update(userTable)
			.set({ autoNearbyListingEnabled: enabled })
			.where(eq(userTable.id, userId))
			.returning();

		return rows.length > 0;
	}

	async listUsersWithAutoNearbyListingEnabled(): Promise<Array<{ id: string }>> {
		return this.db
			.select({ id: userTable.id })
			.from(userTable)
			.where(eq(userTable.autoNearbyListingEnabled, true));
	}
}
