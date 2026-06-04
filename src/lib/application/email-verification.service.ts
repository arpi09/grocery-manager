import { generateId } from '$lib/infrastructure/auth/id';
import { generateSecureToken, hashSecureToken, verifySecureToken } from '$lib/infrastructure/auth/secure-token';
import type { IEmailVerificationRepository } from '$lib/infrastructure/repositories/email-verification.repository';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { consumeRateLimit } from '$lib/server/auth-rate-limit';
import { sendEmailVerificationEmail } from '$lib/server/email';
import { getAppOrigin } from '$lib/server/origin';
import { isEmailVerificationSkipped } from '$lib/server/email-verification-enforcement';

const EMAIL_WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_PER_USER = 5;

export type EmailVerificationSendResult = { sent: boolean };

export class EmailVerificationService {
	constructor(
		private readonly users: IUserRepository,
		private readonly tokens: IEmailVerificationRepository
	) {}

	async sendSignupVerification(
		userId: string,
		locale: 'sv' | 'en' = 'sv'
	): Promise<EmailVerificationSendResult> {
		const user = await this.users.findById(userId);
		if (!user || user.emailVerifiedAt) {
			return { sent: false };
		}

		if (isEmailVerificationSkipped()) {
			await this.users.markEmailVerified(userId);
			return { sent: false };
		}

		return this.issueVerificationEmail(user.id, user.email, locale);
	}

	async resendVerification(
		userId: string,
		clientIp: string,
		locale: 'sv' | 'en' = 'sv'
	): Promise<EmailVerificationSendResult> {
		const ipKey = `email-verify:ip:${clientIp}`;
		if (!consumeRateLimit(ipKey, 20, EMAIL_WINDOW_MS)) {
			return { sent: true };
		}

		const user = await this.users.findById(userId);
		if (!user || user.emailVerifiedAt) {
			return { sent: true };
		}

		const emailKey = `email-verify:email:${user.email}`;
		if (!consumeRateLimit(emailKey, MAX_PER_EMAIL, EMAIL_WINDOW_MS)) {
			return { sent: true };
		}

		const since = new Date(Date.now() - EMAIL_WINDOW_MS);
		const recent = await this.tokens.countRecentForUser(user.id, since);
		if (recent >= MAX_PER_USER) {
			return { sent: true };
		}

		return this.issueVerificationEmail(user.id, user.email, locale);
	}

	private async issueVerificationEmail(
		userId: string,
		email: string,
		locale: 'sv' | 'en'
	): Promise<EmailVerificationSendResult> {
		await this.tokens.invalidateAllForUser(userId);

		const rawToken = generateSecureToken();
		const tokenHash = hashSecureToken(rawToken);
		const tokenId = generateId();
		await this.tokens.createToken(userId, tokenId, tokenHash);

		const verifyUrl = `${getAppOrigin()}/verify-email/${rawToken}`;
		await sendEmailVerificationEmail({ to: email, verifyUrl, locale });

		return { sent: true };
	}

	async completeSignupVerification(
		rawToken: string
	): Promise<{ ok: true; userId: string } | { ok: false }> {
		const tokenHash = hashSecureToken(rawToken);
		const row = await this.tokens.findValidByTokenHash(tokenHash);
		if (!row || !verifySecureToken(rawToken, row.tokenHash)) {
			return { ok: false };
		}

		await this.users.markEmailVerified(row.userId);
		await this.tokens.markUsed(row.id);
		await this.tokens.invalidateAllForUser(row.userId);
		return { ok: true, userId: row.userId };
	}

	async isTokenValid(rawToken: string): Promise<boolean> {
		const tokenHash = hashSecureToken(rawToken);
		const row = await this.tokens.findValidByTokenHash(tokenHash);
		return Boolean(row && verifySecureToken(rawToken, row.tokenHash));
	}
}
