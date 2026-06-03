import { generateId } from '$lib/infrastructure/auth/id';
import { hashPassword } from '$lib/infrastructure/auth/password';
import { generateSecureToken, hashSecureToken, verifySecureToken } from '$lib/infrastructure/auth/secure-token';
import type { IPasswordResetRepository } from '$lib/infrastructure/repositories/password-reset.repository';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { consumeRateLimit } from '$lib/server/auth-rate-limit';
import { sendPasswordResetEmail } from '$lib/server/email';
import { getAppOrigin } from '$lib/server/origin';

const EMAIL_WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 10;

export type PasswordResetRequestResult = { sent: boolean };

export class PasswordResetService {
	constructor(
		private readonly users: IUserRepository,
		private readonly tokens: IPasswordResetRepository
	) {}

	async requestReset(
		email: string,
		clientIp: string,
		locale: 'sv' | 'en' = 'sv'
	): Promise<PasswordResetRequestResult> {
		const normalized = email.trim().toLowerCase();
		const ipKey = `pw-reset:ip:${clientIp}`;
		const emailKey = `pw-reset:email:${normalized}`;

		if (!consumeRateLimit(ipKey, MAX_PER_IP, EMAIL_WINDOW_MS)) {
			return { sent: true };
		}

		if (!consumeRateLimit(emailKey, MAX_PER_EMAIL, EMAIL_WINDOW_MS)) {
			return { sent: true };
		}

		const user = await this.users.findByEmail(normalized);
		if (!user) {
			return { sent: true };
		}

		const since = new Date(Date.now() - EMAIL_WINDOW_MS);
		const recent = await this.tokens.countRecentForUser(user.id, since);
		if (recent >= MAX_PER_EMAIL) {
			return { sent: true };
		}

		await this.tokens.invalidateAllForUser(user.id);

		const rawToken = generateSecureToken();
		const tokenHash = hashSecureToken(rawToken);
		const tokenId = generateId();
		await this.tokens.createToken(user.id, tokenId, tokenHash);

		const resetUrl = `${getAppOrigin()}/reset-password/${rawToken}`;
		await sendPasswordResetEmail({
			to: user.email,
			resetUrl,
			locale
		});

		return { sent: true };
	}

	async resetPassword(
		rawToken: string,
		newPassword: string
	): Promise<{ ok: true; userId: string } | { ok: false }> {
		const tokenHash = hashSecureToken(rawToken);
		const row = await this.tokens.findValidByTokenHash(tokenHash);
		if (!row || !verifySecureToken(rawToken, row.tokenHash)) {
			return { ok: false };
		}

		const passwordHash = await hashPassword(newPassword);
		await this.users.updatePasswordHash(row.userId, passwordHash);
		await this.tokens.markUsed(row.id);
		await this.tokens.invalidateAllForUser(row.userId);
		return { ok: true, userId: row.userId };
	}

	async adminTriggerReset(
		targetUserId: string,
		options?: { forceReset?: boolean; locale?: 'sv' | 'en' }
	): Promise<PasswordResetRequestResult> {
		const user = await this.users.findById(targetUserId);
		if (!user) {
			return { sent: false };
		}

		if (options?.forceReset) {
			await this.users.setMustResetPassword(targetUserId, true);
		}

		await this.tokens.invalidateAllForUser(targetUserId);

		const rawToken = generateSecureToken();
		const tokenHash = hashSecureToken(rawToken);
		const tokenId = generateId();
		await this.tokens.createToken(targetUserId, tokenId, tokenHash);

		const resetUrl = `${getAppOrigin()}/reset-password/${rawToken}`;
		await sendPasswordResetEmail({
			to: user.email,
			resetUrl,
			locale: options?.locale ?? 'sv'
		});

		return { sent: true };
	}
}
