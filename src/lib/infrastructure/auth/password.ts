import { hash, verify } from '@node-rs/argon2';

const hashOptions = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
};

export async function hashPassword(password: string): Promise<string> {
	return hash(password, hashOptions);
}

export async function verifyPassword(hashValue: string, password: string): Promise<boolean> {
	try {
		return await verify(hashValue, password, hashOptions);
	} catch {
		// Malformed legacy hashes must not surface as 500s during login.
		return false;
	}
}
