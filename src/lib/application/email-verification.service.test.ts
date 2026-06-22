import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/infrastructure/auth/secure-token', () => ({
	generateSecureToken: vi.fn().mockReturnValue('raw-token'),
	hashSecureToken: vi.fn().mockReturnValue('hash'),
	verifySecureToken: vi.fn().mockReturnValue(true)
}));

vi.mock('$lib/infrastructure/auth/id', () => ({
	generateId: vi.fn().mockReturnValue('token-id')
}));

import { EmailVerificationService } from './email-verification.service';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';
import type { IEmailVerificationRepository } from '$lib/infrastructure/repositories/email-verification.repository';
import type { AppOriginPort } from '$lib/application/ports/app-origin.port';
import type { EmailPort } from '$lib/application/ports/email.port';
import type { EmailVerificationPolicyPort } from '$lib/application/ports/email-verification-policy.port';
import type { RateLimitPort } from '$lib/application/ports/rate-limit.port';

describe('EmailVerificationService', () => {
	let users: IUserRepository;
	let tokens: IEmailVerificationRepository;
	let service: EmailVerificationService;
	const rateLimit: RateLimitPort = { consume: vi.fn().mockReturnValue(true) };
	const email: EmailPort = {
		sendEmailVerificationEmail: vi.fn().mockResolvedValue({ ok: true }),
		sendPasswordResetEmail: vi.fn(),
		sendExpiryReminderEmail: vi.fn(),
		isEmailSendingDisabledFailure: () => false,
		getPmfDigestTo: () => null,
		sendOwnerPmfDigest: vi.fn(),
		getErrorAlertTo: () => null,
		sendOwnerErrorAlert: vi.fn()
	};
	const appOrigin: AppOriginPort = { getOrigin: () => 'https://app.test' };
	const verificationPolicy: EmailVerificationPolicyPort = { isSkipped: () => false };

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
			updateMarketProfile: vi.fn(),
			updateThemePreference: vi.fn(),
			markEmailVerified: vi.fn(),
			getShoppingToPantryMode: vi.fn(),
			updateShoppingToPantryMode: vi.fn(),
			deleteUser: vi.fn(),
			getAutoNearbyListingEnabled: vi.fn(),
			updateAutoNearbyListingEnabled: vi.fn(),
			listUsersWithAutoNearbyListingEnabled: vi.fn(),
			getMarketListingSettings: vi.fn(),
			updateMarketListingSettings: vi.fn()
		};
		tokens = {
			createToken: vi.fn(),
			findValidByTokenHash: vi.fn(),
			markUsed: vi.fn(),
			invalidateAllForUser: vi.fn(),
			countRecentForUser: vi.fn().mockResolvedValue(0)
		};
		service = new EmailVerificationService(
			users,
			tokens,
			rateLimit,
			email,
			appOrigin,
			verificationPolicy
		);
	});

	it('sends signup verification for unverified users', async () => {
		vi.mocked(users.findById).mockResolvedValue({
			id: 'user-1',
			email: 'a@example.com',
			passwordHash: 'x',
			mustResetPassword: false,
			emailVerifiedAt: null
		});

		const result = await service.sendSignupVerification('user-1', 'en');
		expect(result).toEqual({ sent: true });
		expect(tokens.invalidateAllForUser).toHaveBeenCalledWith('user-1');
		expect(email.sendEmailVerificationEmail).toHaveBeenCalled();
	});

	it('completes signup verification with a valid token', async () => {
		vi.mocked(tokens.findValidByTokenHash).mockResolvedValue({
			id: 'tok-1',
			userId: 'user-1',
			tokenHash: 'hash',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: null
		});

		const result = await service.completeSignupVerification('raw-token');
		expect(result).toEqual({ ok: true, userId: 'user-1' });
		expect(users.markEmailVerified).toHaveBeenCalledWith('user-1');
		expect(tokens.markUsed).toHaveBeenCalledWith('tok-1');
	});
});
