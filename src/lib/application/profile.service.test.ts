import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileNotFoundError, ProfileService } from './profile.service';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';

describe('ProfileService', () => {
	let users: IUserRepository;
	let service: ProfileService;

	beforeEach(() => {
		users = {
			findByEmail: vi.fn(),
			findById: vi.fn(),
			create: vi.fn(),
			createOAuthUser: vi.fn(),
			updatePasswordHash: vi.fn(),
			setMustResetPassword: vi.fn(),
			findProfileById: vi.fn(),
			updateProfile: vi.fn(),
			updateMarketProfile: vi.fn(),
			updateThemePreference: vi.fn(),
			markEmailVerified: vi.fn(),
			getShoppingToPantryMode: vi.fn(),
			updateShoppingToPantryMode: vi.fn(),
			deleteUser: vi.fn(),
			getAutoNearbyListingEnabled: vi.fn(),
			updateAutoNearbyListingEnabled: vi.fn(),
			listUsersWithAutoNearbyListingEnabled: vi.fn()
		};
		service = new ProfileService(users);
	});

	it('returns profile for existing user', async () => {
		const profile = {
			id: 'user-1',
			email: 'test@example.com',
			displayName: 'Test User',
			avatarUrl: null,
			marketFirstName: null
		};
		vi.mocked(users.findProfileById).mockResolvedValue(profile);

		await expect(service.getProfile('user-1')).resolves.toEqual(profile);
	});

	it('throws when profile is missing', async () => {
		vi.mocked(users.findProfileById).mockResolvedValue(null);

		await expect(service.getProfile('missing')).rejects.toBeInstanceOf(ProfileNotFoundError);
	});

	it('updates profile fields', async () => {
		const updated = {
			id: 'user-1',
			email: 'test@example.com',
			displayName: 'New Name',
			avatarUrl: 'https://example.com/avatar.png',
			marketFirstName: null
		};
		vi.mocked(users.updateProfile).mockResolvedValue(updated);

		await expect(
			service.updateProfile('user-1', {
				displayName: 'New Name',
				avatarUrl: 'https://example.com/avatar.png'
			})
		).resolves.toEqual(updated);
	});

	it('updates theme preference', async () => {
		vi.mocked(users.updateThemePreference).mockResolvedValue('dark');

		await expect(service.setThemePreference('user-1', 'dark')).resolves.toBe('dark');
		expect(users.updateThemePreference).toHaveBeenCalledWith('user-1', 'dark');
	});

	it('throws when theme preference update target is missing', async () => {
		vi.mocked(users.updateThemePreference).mockResolvedValue(null);

		await expect(service.setThemePreference('missing', 'light')).rejects.toBeInstanceOf(
			ProfileNotFoundError
		);
	});
});