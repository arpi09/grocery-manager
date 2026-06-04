import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { AuthError, AuthService } from './auth.service';
import { DrizzleUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { verifyPassword } from '$lib/infrastructure/auth/password';
import { userTable } from '$lib/infrastructure/db/schema';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Auth integration', () => {
	let integrationDb: IntegrationDbContext;
	let authService: AuthService;
	let users: DrizzleUserRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		users = new DrizzleUserRepository(integrationDb.db);
		authService = new AuthService(users);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('registers a user and persists hashed credentials in the database', async () => {
		const result = await authService.register('new-user@example.com', 'secret123');

		expect(result).toEqual({
			id: expect.any(String),
			email: 'new-user@example.com'
		});

		const [row] = await integrationDb.db
			.select({
				id: userTable.id,
				email: userTable.email,
				passwordHash: userTable.passwordHash,
				themePreference: userTable.themePreference
			})
			.from(userTable)
			.where(eq(userTable.email, 'new-user@example.com'))
			.limit(1);

		expect(row?.id).toBe(result.id);
		expect(row?.themePreference).toBe('light');
		expect(row?.passwordHash).not.toBe('secret123');
		expect(row?.passwordHash).toBeTruthy();
		expect(await verifyPassword(row!.passwordHash!, 'secret123')).toBe(true);
	});

	it('logs in with credentials stored in the database', async () => {
		await authService.register('login-user@example.com', 'correct-password');

		const result = await authService.login('login-user@example.com', 'correct-password');

		expect(result.email).toBe('login-user@example.com');
	});

	it('rejects duplicate registration', async () => {
		await authService.register('duplicate@example.com', 'first-password');

		await expect(authService.register('duplicate@example.com', 'second-password')).rejects.toThrow(
			AuthError
		);
	});

	it('rejects login with wrong password', async () => {
		await authService.register('wrong-pass@example.com', 'actual-password');

		await expect(authService.login('wrong-pass@example.com', 'bad-password')).rejects.toThrow(
			AuthError
		);
	});
});
