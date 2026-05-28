import { generateId } from '$lib/infrastructure/auth/id';
import { hashPassword, verifyPassword } from '$lib/infrastructure/auth/password';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';

export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthError';
	}
}

export class AuthService {
	constructor(private readonly users: IUserRepository) {}

	async register(email: string, password: string) {
		const existing = await this.users.findByEmail(email);
		if (existing) {
			throw new AuthError('An account with this email already exists');
		}

		const passwordHash = await hashPassword(password);
		const id = generateId();
		return this.users.create(email, passwordHash, id);
	}

	async login(email: string, password: string) {
		const user = await this.users.findByEmail(email);
		if (!user) {
			throw new AuthError('Invalid email or password');
		}

		const valid = await verifyPassword(user.passwordHash, password);
		if (!valid) {
			throw new AuthError('Invalid email or password');
		}

		return { id: user.id, email: user.email };
	}
}
