import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/infrastructure/auth/password', () => ({
	hashPassword: vi.fn().mockResolvedValue('hashed-password'),
	verifyPassword: vi.fn().mockResolvedValue(true)
}));

import { hashPassword, verifyPassword } from '$lib/infrastructure/auth/password';
import { AuthService } from './auth.service';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';

describe('AuthService', () => {
	let users: IUserRepository;
	let service: AuthService;

	beforeEach(() => {
		vi.clearAllMocks();
		users = {
			findByEmail: vi.fn(),
			findById: vi.fn(),
			create: vi.fn(),
			createOAuthUser: vi.fn(),
			updatePasswordHash: vi.fn(),
			setMustResetPassword: vi.fn(),
			findProfileById: vi.fn(),
			updateProfile: vi.fn(),
			updateThemePreference: vi.fn(),
			markEmailVerified: vi.fn(),
			getShoppingToPantryMode: vi.fn(),
			updateShoppingToPantryMode: vi.fn(),
			deleteUser: vi.fn()
		};
		service = new AuthService(users);
	});

	it('registers a new user with hashed password', async () => {
		vi.mocked(users.findByEmail).mockResolvedValue(null);
		vi.mocked(users.create).mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

		const result = await service.register('test@example.com', 'secret123');

		expect(result).toEqual({ id: 'user-1', email: 'test@example.com' });
		expect(hashPassword).toHaveBeenCalledWith('secret123');
		expect(users.create).toHaveBeenCalledWith(
			'test@example.com',
			'hashed-password',
			expect.any(String),
			undefined
		);
	});

	it('passes signup UTM to user create', async () => {
		vi.mocked(users.findByEmail).mockResolvedValue(null);
		vi.mocked(users.create).mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

		const signupUtm = { source: 'reddit', medium: 'community', campaign: 'matsvinn_w12' };
		await service.register('test@example.com', 'secret123', signupUtm);

		expect(users.create).toHaveBeenCalledWith(
			'test@example.com',
			'hashed-password',
			expect.any(String),
			signupUtm
		);
	});

	it('logs in with valid credentials', async () => {
		vi.mocked(users.findByEmail).mockResolvedValue({
			id: 'user-1',
			email: 'test@example.com',
			passwordHash: 'stored-hash',
			mustResetPassword: false,
			emailVerifiedAt: new Date()
		});

		const result = await service.login('test@example.com', 'secret123');

		expect(result).toEqual({
			id: 'user-1',
			email: 'test@example.com',
			mustResetPassword: false,
			emailVerifiedAt: expect.any(Date)
		});
		expect(verifyPassword).toHaveBeenCalledWith('stored-hash', 'secret123');
	});
});