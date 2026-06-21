import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from './admin.service';
import type { PasswordResetService } from './password-reset.service';
import type { IAdminRepository } from '$lib/infrastructure/repositories/admin.repository';
import type { IAdminActionRepository } from '$lib/infrastructure/repositories/admin-action.repository';
import type { BillingService } from './billing.service';

describe('AdminService', () => {
	let admin: IAdminRepository;
	let passwordReset: PasswordResetService;
	let adminActions: IAdminActionRepository;
	let billing: BillingService;
	let service: AdminService;

	beforeEach(() => {
		admin = {
			getDashboardStats: vi.fn(),
			listUsers: vi.fn(),
			listRecentErrors: vi.fn(),
			listRecentErrorSummaries: vi.fn(),
			listErrorSummariesByPath: vi.fn(),
			listErrorPathCountsSince: vi.fn(),
			getErrorStack: vi.fn(),
			setUserRole: vi.fn(),
			setUserPetsEnabled: vi.fn(),
			invalidateAllSessions: vi.fn(),
			invalidateUserSessions: vi.fn()
		};
		passwordReset = {
			requestReset: vi.fn(),
			resetPassword: vi.fn(),
			adminTriggerReset: vi.fn().mockResolvedValue({ sent: true })
		} as unknown as PasswordResetService;
		adminActions = { logAction: vi.fn().mockResolvedValue(undefined) };
		billing = {
			adminSetHouseholdPlan: vi.fn().mockResolvedValue(undefined)
		} as unknown as BillingService;
		service = new AdminService(admin, passwordReset, adminActions, billing);
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
				inventoryCount: 5,
				householdId: 'hh-1',
				householdPlanTier: 'free' as const,
				hasStripeBilling: false
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

	it('lists error summaries by path in 24h window', async () => {
		const since = new Date('2024-06-01T00:00:00Z');
		const summaries = [
			{
				id: 'err-1',
				message: 'boom',
				path: '/inkop',
				userId: null,
				statusCode: 500,
				createdAt: new Date(),
				hasStack: true
			}
		];
		vi.mocked(admin.listErrorSummariesByPath).mockResolvedValue(summaries);

		const result = await service.listErrorSummariesByPath(since, 50, '/inkop');

		expect(result).toEqual(summaries);
		expect(admin.listErrorSummariesByPath).toHaveBeenCalledWith(since, 50, '/inkop');
	});

	it('lists error path counts since cutoff', async () => {
		const since = new Date('2024-06-01T00:00:00Z');
		const counts = [{ path: '/inkop', count: 3 }];
		vi.mocked(admin.listErrorPathCountsSince).mockResolvedValue(counts);

		const result = await service.listErrorPathCountsSince(since, 10);

		expect(result).toEqual(counts);
		expect(admin.listErrorPathCountsSince).toHaveBeenCalledWith(since, 10);
	});
});
