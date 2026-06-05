import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { OAuthService } from './oauth.service';
import { DrizzleOAuthRepository } from '$lib/infrastructure/repositories/oauth.repository';
import { DrizzleUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { userTable } from '$lib/infrastructure/db/schema';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

vi.mock('$lib/infrastructure/auth/google-id-token', () => ({
	verifyGoogleIdToken: vi.fn()
}));

import { verifyGoogleIdToken } from '$lib/infrastructure/auth/google-id-token';

const CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

describe('OAuth integration', () => {
	let integrationDb: IntegrationDbContext;
	let oauthService: OAuthService;
	let users: DrizzleUserRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		users = new DrizzleUserRepository(integrationDb.db);
		oauthService = new OAuthService(users, new DrizzleOAuthRepository(integrationDb.db));
	});

	beforeEach(async () => {
		await integrationDb.reset();
		vi.mocked(verifyGoogleIdToken).mockReset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('creates a new user from a valid Google token', async () => {
		vi.mocked(verifyGoogleIdToken).mockResolvedValue({
			ok: true,
			claims: {
				sub: 'google-sub-new',
				email: 'new-oauth@example.com',
				name: 'OAuth User',
				picture: 'https://example.com/avatar.png'
			}
		});

		const result = await oauthService.resolveGoogleUser('fake-id-token', CLIENT_ID);

		expect(result).toEqual({ ok: true, userId: expect.any(String), isNewUser: true });

		const [row] = await integrationDb.db
			.select()
			.from(userTable)
			.where(eq(userTable.email, 'new-oauth@example.com'))
			.limit(1);

		expect(row?.emailVerifiedAt).toBeTruthy();
	});

	it('links Google to an existing email user', async () => {
		await integrationDb.seedUser({ id: 'user-existing', email: 'existing@example.com' });

		vi.mocked(verifyGoogleIdToken).mockResolvedValue({
			ok: true,
			claims: {
				sub: 'google-sub-existing',
				email: 'existing@example.com',
				name: 'Existing',
				picture: undefined
			}
		});

		const result = await oauthService.resolveGoogleUser('fake-id-token', CLIENT_ID);

		expect(result).toEqual({ ok: true, userId: 'user-existing', isNewUser: false });
	});

	it('rejects invalid tokens', async () => {
		vi.mocked(verifyGoogleIdToken).mockResolvedValue({ ok: false, error: 'invalid_token' });

		const result = await oauthService.resolveGoogleUser('bad-token', CLIENT_ID);

		expect(result).toEqual({ ok: false, error: 'invalid_token' });
	});
});
