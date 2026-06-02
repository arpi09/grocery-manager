import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function generateSecureToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashSecureToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function verifySecureToken(token: string, storedHash: string): boolean {
	const computed = hashSecureToken(token);
	try {
		return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'));
	} catch {
		return false;
	}
}
