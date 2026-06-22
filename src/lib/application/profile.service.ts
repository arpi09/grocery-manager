import {
	normalizeShoppingToPantryMode,
	type ShoppingToPantryMode
} from '$lib/domain/shopping-to-pantry';
import type { ThemePreference } from '$lib/domain/theme';
import type { UserProfile } from '$lib/domain/user';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';

export class ProfileNotFoundError extends Error {
	constructor() {
		super('User not found');
		this.name = 'ProfileNotFoundError';
	}
}

export class ProfileService {
	constructor(private readonly users: IUserRepository) {}

	async getProfile(userId: string): Promise<UserProfile> {
		const profile = await this.users.findProfileById(userId);
		if (!profile) {
			throw new ProfileNotFoundError();
		}
		return profile;
	}

	async updateProfile(
		userId: string,
		input: { displayName: string | null; avatarUrl: string | null }
	): Promise<UserProfile> {
		const updated = await this.users.updateProfile(userId, input);
		if (!updated) {
			throw new ProfileNotFoundError();
		}
		return updated;
	}

	async updateMarketProfile(
		userId: string,
		marketFirstName: string | null
	): Promise<UserProfile> {
		const updated = await this.users.updateMarketProfile(userId, marketFirstName);
		if (!updated) {
			throw new ProfileNotFoundError();
		}
		return updated;
	}

	async setThemePreference(userId: string, themePreference: ThemePreference): Promise<ThemePreference> {
		const updated = await this.users.updateThemePreference(userId, themePreference);
		if (!updated) {
			throw new ProfileNotFoundError();
		}
		return updated;
	}

	async setShoppingToPantryMode(
		userId: string,
		mode: ShoppingToPantryMode
	): Promise<ShoppingToPantryMode> {
		const updated = await this.users.updateShoppingToPantryMode(userId, mode);
		if (!updated) {
			throw new ProfileNotFoundError();
		}
		return normalizeShoppingToPantryMode(updated);
	}

	async getShoppingToPantryMode(userId: string): Promise<ShoppingToPantryMode> {
		const mode = await this.users.getShoppingToPantryMode(userId);
		return normalizeShoppingToPantryMode(mode);
	}
}