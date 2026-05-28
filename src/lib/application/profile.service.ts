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

	async setThemePreference(userId: string, themePreference: ThemePreference): Promise<ThemePreference> {
		const updated = await this.users.updateThemePreference(userId, themePreference);
		if (!updated) {
			throw new ProfileNotFoundError();
		}
		return updated;
	}
}