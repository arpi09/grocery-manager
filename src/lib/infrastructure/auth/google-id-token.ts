import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export type GoogleIdTokenClaims = {
	sub: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	picture?: string;
};

export type GoogleIdTokenValidationError =
	| 'invalid_token'
	| 'invalid_audience'
	| 'invalid_issuer'
	| 'email_not_verified'
	| 'missing_email'
	| 'missing_subject';

export function validateGoogleIdTokenClaims(
	payload: JWTPayload,
	clientId: string,
	now: Date = new Date()
): { ok: true; claims: GoogleIdTokenClaims } | { ok: false; error: GoogleIdTokenValidationError } {
	const iss = typeof payload.iss === 'string' ? payload.iss : '';
	if (!GOOGLE_ISSUERS.has(iss)) {
		return { ok: false, error: 'invalid_issuer' };
	}

	const aud = payload.aud;
	const audienceOk =
		(typeof aud === 'string' && aud === clientId) ||
		(Array.isArray(aud) && aud.includes(clientId));
	if (!audienceOk) {
		return { ok: false, error: 'invalid_audience' };
	}

	const exp = typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
	if (!exp || exp <= now.getTime()) {
		return { ok: false, error: 'invalid_token' };
	}

	const sub = typeof payload.sub === 'string' ? payload.sub : '';
	if (!sub) {
		return { ok: false, error: 'missing_subject' };
	}

	const email = typeof payload.email === 'string' ? payload.email : undefined;
	if (!email) {
		return { ok: false, error: 'missing_email' };
	}

	if (payload.email_verified !== true) {
		return { ok: false, error: 'email_not_verified' };
	}

	return {
		ok: true,
		claims: {
			sub,
			email,
			email_verified: true,
			name: typeof payload.name === 'string' ? payload.name : undefined,
			picture: typeof payload.picture === 'string' ? payload.picture : undefined
		}
	};
}

export async function verifyGoogleIdToken(
	idToken: string,
	clientId: string
): Promise<{ ok: true; claims: GoogleIdTokenClaims } | { ok: false; error: GoogleIdTokenValidationError }> {
	try {
		const { payload } = await jwtVerify(idToken, JWKS, {
			issuer: ['https://accounts.google.com', 'accounts.google.com'],
			audience: clientId
		});
		return validateGoogleIdTokenClaims(payload, clientId);
	} catch {
		return { ok: false, error: 'invalid_token' };
	}
}
