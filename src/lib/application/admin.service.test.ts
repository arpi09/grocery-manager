import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from './admin.service';
import type { IAdminRepository } from '$lib/infrastructure/repositories/admin.repository';

describe('AdminService', () => {
	let admin: IAdminRepository;
	let service: AdminService;

	beforeEach(() => {
		admin = {
			getDashboardStats: vi.fn(),
			listUsers: vi.fn(),
			listRecentErrors: vi.fn(),
			listRecentErrorSummaries: vi.fn(),
			getErrorStack: vi.fn(),
			setUserRole: vi.fn(),
			setUserPetsEnabled: vi.fn(),
			invalidateAllSessions: vi.fn(),
			invalidateUserSessions: vi.fn()
		};
		service = new AdminService(admin);
	});

	it('returns dashboard stats', async () => {
		const stats = {
			userCount: 3,
			householdCount: 2,
			membershipCount: 4,
			inventoryCount: 10,
			shoppingListItemCount: null,
			errorCount7Days: 1,
			errorCountTotal: 5,
			activeNowCount: 1,
			activeSessionCount: 2,
			lastActivityAt: new Date(),
			databaseBackend: 'pglite' as const
		};
		vi.mocked(admin.getDashboardStats).mockResolvedValue(stats);

		const result = await service.getDashboardStats();

		expect(result).toEqual(stats);
	});

	it('lists users with pagination', async () => {
		const users = [
			{
				id: 'user-1',
				email: 'a@example.com',
				role: 'user' as const,
				petsEnabled: false,
				signupUtmSource: 'facebook',
				createdAt: new Date(),
				lastSeenAt: new Date(),
				isActiveNow: true,
				hasActiveSession: true,
				inventoryCount: 5
			}
		];
		vi.mocked(admin.listUsers).mockResolvedValue({ users, total: 1 });

		const result = await service.listUsers(25, 0);

		expect(result).toEqual({ users, total: 1 });
		expect(admin.listUsers).toHaveBeenCalledWith(25, 0);
	});

	it('sets user role when actor is not the target', async () => {
		await service.setUserRole('admin-1', 'user-2', 'admin');

		expect(admin.setUserRole).toHaveBeenCalledWith('user-2', 'admin');
	});

	it('allows admin to keep own admin role', async () => {
		await service.setUserRole('admin-1', 'admin-1', 'admin');

		expect(admin.setUserRole).toHaveBeenCalledWith('admin-1', 'admin');
	});

	it('sets pets enabled for user', async () => {
		await service.setUserPetsEnabled('user-1', true);

		expect(admin.setUserPetsEnabled).toHaveBeenCalledWith('user-1', true);
	});
});
