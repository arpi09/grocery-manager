import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEnv, mockGetDb, mockHashPassword, mockGenerateId } = vi.hoisted(() => ({
	mockEnv: { ADMIN_EMAIL: undefined as string | undefined, ADMIN_PASSWORD: undefined as string | undefined },
	mockGetDb: vi.fn(),
	mockHashPassword: vi.fn().mockResolvedValue('hashed-from-env'),
	mockGenerateId: vi.fn().mockReturnValue('new-admin-id')
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

vi.mock('$lib/infrastructure/auth/password', () => ({
	hashPassword: mockHashPassword
}));

vi.mock('$lib/infrastructure/auth/id', () => ({
	generateId: mockGenerateId
}));

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: mockGetDb
}));

import { ensureDefaultAdminUser } from './seed-admin';

describe('ensureDefaultAdminUser', () => {
	let selectResult: Array<{ id: string; role: string }>;
	let insertValues: ReturnType<typeof vi.fn>;
	let updateSet: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockEnv.ADMIN_EMAIL = undefined;
		mockEnv.ADMIN_PASSWORD = undefined;
		selectResult = [];
		insertValues = vi.fn().mockResolvedValue(undefined);
		updateSet = vi.fn().mockResolvedValue(undefined);

		const selectChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockImplementation(async () => selectResult)
		};

		mockGetDb.mockReturnValue({
			select: vi.fn().mockReturnValue(selectChain),
			insert: vi.fn().mockReturnValue({ values: insertValues }),
			update: vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: updateSet
				})
			})
		});
	});

	it('creates admin when missing and ADMIN_PASSWORD is set', async () => {
		mockEnv.ADMIN_PASSWORD = 'secret-admin';
		selectResult = [];

		await ensureDefaultAdminUser();

		expect(mockHashPassword).toHaveBeenCalledWith('secret-admin');
		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'new-admin-id',
				email: 'arvid.pilhall@me.com',
				passwordHash: 'hashed-from-env',
				role: 'admin',
				petsEnabled: true
			})
		);
	});

	it('updates password hash on startup when admin exists and ADMIN_PASSWORD is set', async () => {
		mockEnv.ADMIN_PASSWORD = 'rotated-password';
		selectResult = [{ id: 'admin-1', role: 'admin' }];

		await ensureDefaultAdminUser();

		expect(mockHashPassword).toHaveBeenCalledWith('rotated-password');
		expect(updateSet).toHaveBeenCalled();
	});

	it('skips create when missing user and ADMIN_PASSWORD is unset', async () => {
		selectResult = [];

		await ensureDefaultAdminUser();

		expect(insertValues).not.toHaveBeenCalled();
		expect(mockHashPassword).not.toHaveBeenCalled();
	});

	it('normalizes ADMIN_EMAIL to lowercase', async () => {
		mockEnv.ADMIN_EMAIL = 'Admin@Example.COM';
		mockEnv.ADMIN_PASSWORD = 'pw';
		selectResult = [];

		await ensureDefaultAdminUser();

		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({ email: 'admin@example.com' })
		);
	});
});
