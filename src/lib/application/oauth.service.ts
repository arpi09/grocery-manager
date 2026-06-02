import { generateId } from '$lib/infrastructure/auth/id';
import { verifyGoogleIdToken } from '$lib/infrastructure/auth/google-id-token';
import {
	DrizzleOAuthRepository,
	GOOGLE_PROVIDER_ID,
	type IOAuthRepository
} from '$lib/infrastructure/repositories/oauth.repository';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';
import type { SignupUtm } from '$lib/domain/signup-utm';

export type GoogleOAuthUserResult =
	| { ok: true; userId: string; isNewUser: boolean }
	| { ok: false; error: 'invalid_token' | 'email_mismatch' | 'oauth_disabled' };

export class OAuthService {
	constructor(
		private readonly users: IUserRepository,
		private readonly oauth: IOAuthRepository = new DrizzleOAuthRepository()
	) {}

	async resolveGoogleUser(
		idToken: string,
		clientId: string,
		signupUtm?: SignupUtm | null
	): Promise<GoogleOAuthUserResult> {
		if (!clientId.trim()) {
			return { ok: false, error: 'oauth_disabled' };
		}

		const verified = await verifyGoogleIdToken(idToken, clientId);
		if (!verified.ok) {
			return { ok: false, error: 'invalid_token' };
		}

		const { sub, email, name, picture } = verified.claims;
		const normalizedEmail = email!.toLowerCase();

		const linked = await this.oauth.findByProviderUserId(GOOGLE_PROVIDER_ID, sub);
		if (linked) {
			return { ok: true, userId: linked.userId, isNewUser: false };
		}

		const existing = await this.users.findByEmail(normalizedEmail);
		if (existing) {
			await this.oauth.linkAccount(GOOGLE_PROVIDER_ID, sub, existing.id);
			return { ok: true, userId: existing.id, isNewUser: false };
		}

		const id = generateId();
		await this.users.createOAuthUser(
			normalizedEmail,
			id,
			{ displayName: name ?? null, avatarUrl: picture ?? null },
			signupUtm
		);
		await this.oauth.linkAccount(GOOGLE_PROVIDER_ID, sub, id);
		return { ok: true, userId: id, isNewUser: true };
	}
}
