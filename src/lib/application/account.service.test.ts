import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	AccountNotFoundError,
	AccountService,
	DeleteAccountConfirmationError
} from './account.service';
import type { IHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import type { IAccountSessionRepository } from './account.service';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';

describe('AccountService', () => {
	let users: IUserRepository;
	let households: IHouseholdRepository;
	let sessions: IAccountSessionRepository;
	let service: AccountService;

	beforeEach(() => {
		users = {
			findById: vi.fn(),
			deleteUser: vi.fn()
		} as unknown as IUserRepository;

		households = {
			listHouseholdsForUser: vi.fn(),
			getHouseholdById: vi.fn(),
			deleteHousehold: vi.fn(),
			updateMemberRole: vi.fn(),
			removeMember: vi.fn()
		} as unknown as IHouseholdRepository;

		const invalidateUserSessions = vi.fn(async () => 1);
		sessions = { invalidateUserSessions } as IAccountSessionRepository;

		service = new AccountService(users, households, sessions);
	});

	it('rejects invalid confirmation', async () => {
		await expect(service.deleteAccount('user-1', 'fel')).rejects.toBeInstanceOf(
			DeleteAccountConfirmationError
		);
	});

	it('rejects when user is missing', async () => {
		vi.mocked(users.findById).mockResolvedValue(null);

		await expect(service.deleteAccount('missing', 'RADERA')).rejects.toBeInstanceOf(
			AccountNotFoundError
		);
	});

	it('deletes sole-member households before removing user', async () => {
		vi.mocked(users.findById).mockResolvedValue({
			id: 'user-1',
			email: 'user@example.com',
			passwordHash: 'hash',
			mustResetPassword: false,
			emailVerifiedAt: new Date()
		});
		vi.mocked(households.listHouseholdsForUser).mockResolvedValue([
			{ id: 'household-1', name: 'Hemma', role: 'owner', isActive: true }
		]);
		vi.mocked(households.getHouseholdById).mockResolvedValue({
			id: 'household-1',
			name: 'Hemma',
			createdAt: new Date(),
			members: [
				{
					userId: 'user-1',
					email: 'user@example.com',
					displayName: null,
					role: 'owner'
				}
			]
		});
		vi.mocked(households.deleteHousehold).mockResolvedValue(true);
		vi.mocked(users.deleteUser).mockResolvedValue(true);

		await service.deleteAccount('user-1', 'RADERA');

		expect(households.deleteHousehold).toHaveBeenCalledWith('household-1');
		expect(households.removeMember).not.toHaveBeenCalled();
		expect(sessions.invalidateUserSessions).toHaveBeenCalledWith('user-1');
		expect(users.deleteUser).toHaveBeenCalledWith('user-1');
	});

	it('promotes another member when sole owner leaves shared household', async () => {
		vi.mocked(users.findById).mockResolvedValue({
			id: 'user-1',
			email: 'owner@example.com',
			passwordHash: 'hash',
			mustResetPassword: false,
			emailVerifiedAt: new Date()
		});
		vi.mocked(households.listHouseholdsForUser).mockResolvedValue([
			{ id: 'household-1', name: 'Hemma', role: 'owner', isActive: true }
		]);
		vi.mocked(households.getHouseholdById).mockResolvedValue({
			id: 'household-1',
			name: 'Hemma',
			createdAt: new Date(),
			members: [
				{
					userId: 'user-1',
					email: 'owner@example.com',
					displayName: null,
					role: 'owner'
				},
				{
					userId: 'user-2',
					email: 'editor@example.com',
					displayName: null,
					role: 'editor'
				}
			]
		});
		vi.mocked(households.updateMemberRole).mockResolvedValue(true);
		vi.mocked(households.removeMember).mockResolvedValue(true);
		vi.mocked(users.deleteUser).mockResolvedValue(true);

		await service.deleteAccount('user-1', 'DELETE');

		expect(households.updateMemberRole).toHaveBeenCalledWith('household-1', 'user-2', 'owner');
		expect(households.removeMember).toHaveBeenCalledWith('household-1', 'user-1');
		expect(households.deleteHousehold).not.toHaveBeenCalled();
	});
});
