import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileNotFoundError, ProfileService } from './profile.service';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';

describe('ProfileService', () => {
	let users: IUserRepository;
	let service: ProfileService;

	beforeEach(() => {
		users = {
			findByEmail: vi.fn(),
			create: vi.fn(),
			findProfileById: vi.fn(),
			updateProfile: vi.fn()
		};
		service = new ProfileService(users);
	});

	it('returns profile for existing user', async () => {
		const profile = {
			id: 'user-1',
			email: 'test@example.com',
			displayName: 'Test User',
			avatarUrl: null
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
			avatarUrl: 'https://example.com/avatar.png'
		};
		vi.mocked(users.updateProfile).mockResolvedValue(updated);

		await expect(
			service.updateProfile('user-1', {
				displayName: 'New Name',
				avatarUrl: 'https://example.com/avatar.png'
			})
		).resolves.toEqual(updated);
	});
});
