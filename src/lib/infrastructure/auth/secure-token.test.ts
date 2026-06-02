import { describe, expect, it } from 'vitest';
import { generateSecureToken, hashSecureToken, verifySecureToken } from './secure-token';

describe('secure-token', () => {
	it('verifies matching token with constant-time helper', () => {
		const token = generateSecureToken();
		const hash = hashSecureToken(token);
		expect(verifySecureToken(token, hash)).toBe(true);
		expect(verifySecureToken(token + 'x', hash)).toBe(false);
	});
});
