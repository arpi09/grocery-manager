import { describe, expect, it } from 'vitest';
import { validateGoogleIdTokenClaims } from './google-id-token';

describe('validateGoogleIdTokenClaims', () => {
	const clientId = 'test-client-id.apps.googleusercontent.com';
	const now = new Date('2026-06-02T12:00:00Z');

	it('accepts valid verified Google claims', () => {
		const result = validateGoogleIdTokenClaims(
			{
				iss: 'https://accounts.google.com',
				aud: clientId,
				exp: Math.floor(now.getTime() / 1000) + 3600,
				sub: 'google-user-123',
				email: 'user@example.com',
				email_verified: true
			},
			clientId,
			now
		);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.claims.email).toBe('user@example.com');
			expect(result.claims.sub).toBe('google-user-123');
		}
	});

	it('rejects wrong audience', () => {
		const result = validateGoogleIdTokenClaims(
			{
				iss: 'https://accounts.google.com',
				aud: 'other-client',
				exp: Math.floor(now.getTime() / 1000) + 3600,
				sub: 'google-user-123',
				email: 'user@example.com',
				email_verified: true
			},
			clientId,
			now
		);

		expect(result).toEqual({ ok: false, error: 'invalid_audience' });
	});

	it('rejects unverified email', () => {
		const result = validateGoogleIdTokenClaims(
			{
				iss: 'https://accounts.google.com',
				aud: clientId,
				exp: Math.floor(now.getTime() / 1000) + 3600,
				sub: 'google-user-123',
				email: 'user@example.com',
				email_verified: false
			},
			clientId,
			now
		);

		expect(result).toEqual({ ok: false, error: 'email_not_verified' });
	});

	it('rejects expired tokens', () => {
		const result = validateGoogleIdTokenClaims(
			{
				iss: 'https://accounts.google.com',
				aud: clientId,
				exp: Math.floor(now.getTime() / 1000) - 10,
				sub: 'google-user-123',
				email: 'user@example.com',
				email_verified: true
			},
			clientId,
			now
		);

		expect(result).toEqual({ ok: false, error: 'invalid_token' });
	});
});
