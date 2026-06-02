import type { SignupUtm } from '$lib/domain/signup-utm';
import { generateId } from '$lib/infrastructure/auth/id';
import { hashPassword, verifyPassword } from '$lib/infrastructure/auth/password';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';

export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthError';
	}
}

export function isAuthError(error: unknown): error is AuthError {
	return (
		error instanceof AuthError || (error instanceof Error && error.name === 'AuthError')
	);
}

export class AuthService {
	constructor(private readonly users: IUserRepository) {}

	async register(email: string, password: string, signupUtm?: SignupUtm | null) {
		const existing = await this.users.findByEmail(email);
		if (existing) {
			throw new AuthError('An account with this email already exists');
		}

		const passwordHash = await hashPassword(password);
		const id = generateId();
		return this.users.create(email, passwordHash, id, signupUtm);
	}

	async login(email: string, password: string) {
		const user = await this.users.findByEmail(email);
		if (!user || !user.passwordHash) {
			throw new AuthError('Invalid email or password');
		}

		if (user.mustResetPassword) {
			throw new AuthError('Password reset required. Check your email for a reset link.');
		}

		const valid = await verifyPassword(user.passwordHash, password);
		if (!valid) {
			throw new AuthError('Invalid email or password');
		}

		return { id: user.id, email: user.email, mustResetPassword: user.mustResetPassword };
	}
}
