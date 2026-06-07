import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { PasswordResetService } from './password-reset.service';
import { DrizzlePasswordResetRepository } from '$lib/infrastructure/repositories/password-reset.repository';
import { DrizzleUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { verifyPassword } from '$lib/infrastructure/auth/password';
import { userTable } from '$lib/infrastructure/db/schema';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import type { AppOriginPort } from '$lib/application/ports/app-origin.port';
import type { EmailPort } from '$lib/application/ports/email.port';
import type { RateLimitPort } from '$lib/application/ports/rate-limit.port';

describe('Password reset integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: PasswordResetService;
	let users: DrizzleUserRepository;
	let tokens: DrizzlePasswordResetRepository;
	const sentEmails: Array<{ to: string; resetUrl: string }> = [];

	const rateLimit: RateLimitPort = { consume: () => true };
	const email: EmailPort = {
		sendEmailVerificationEmail: vi.fn(),
		sendPasswordResetEmail: vi.fn(async (options) => {
			sentEmails.push({ to: options.to, resetUrl: options.resetUrl });
			return { ok: true as const };
		}),
		sendExpiryReminderEmail: vi.fn(),
		isEmailSendingDisabledFailure: () => false,
		getPmfDigestTo: () => null,
		sendOwnerPmfDigest: vi.fn(),
		getErrorAlertTo: () => null,
		sendOwnerErrorAlert: vi.fn()
	};
	const appOrigin: AppOriginPort = { getOrigin: () => 'https://app.test' };

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		users = new DrizzleUserRepository(integrationDb.db);
		tokens = new DrizzlePasswordResetRepository(integrationDb.db);
		service = new PasswordResetService(users, tokens, rateLimit, email, appOrigin);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		sentEmails.length = 0;
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('issues a reset token and updates the password end-to-end', async () => {
		await integrationDb.seedUser({ id: 'user-reset', email: 'reset@example.com' });

		await service.requestReset('reset@example.com', '127.0.0.1', 'sv');
		expect(sentEmails).toHaveLength(1);

		const rawToken = sentEmails[0].resetUrl.split('/').pop()!;
		const result = await service.resetPassword(rawToken, 'new-secret-99');
		expect(result).toEqual({ ok: true, userId: 'user-reset' });

		const [row] = await integrationDb.db
			.select({ passwordHash: userTable.passwordHash })
			.from(userTable)
			.where(eq(userTable.id, 'user-reset'))
			.limit(1);

		expect(await verifyPassword(row!.passwordHash!, 'new-secret-99')).toBe(true);
	});

	it('rejects expired or invalid tokens', async () => {
		const result = await service.resetPassword('not-a-real-token', 'new-secret-99');
		expect(result).toEqual({ ok: false });
	});
});
