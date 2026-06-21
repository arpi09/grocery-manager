import type { AppErrorPathCount, AppErrorSummary } from '$lib/domain/error-log';
import type { UserRole } from '$lib/domain/user';
import type { BillingService } from '$lib/application/billing.service';
import type { PasswordResetService } from '$lib/application/password-reset.service';
import type { PlanTier } from '$lib/domain/plan';
import type {
	AdminDashboardStats,
	IAdminRepository
} from '$lib/infrastructure/repositories/admin.repository';
import type { IAdminActionRepository } from '$lib/infrastructure/repositories/admin-action.repository';

export class AdminError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AdminError';
	}
}

export class AdminService {
	constructor(
		private readonly admin: IAdminRepository,
		private readonly passwordReset: PasswordResetService,
		private readonly adminActions: IAdminActionRepository,
		private readonly billing: BillingService
	) {}

	getDashboardStats(): Promise<AdminDashboardStats> {
		return this.admin.getDashboardStats();
	}

	listUsers(limit: number, offset: number) {
		return this.admin.listUsers(limit, offset);
	}

	listRecentErrors(limit: number) {
		return this.admin.listRecentErrors(limit);
	}

	listRecentErrorSummaries(limit: number): Promise<AppErrorSummary[]> {
		return this.admin.listRecentErrorSummaries(limit);
	}

	listErrorSummariesByPath(
		since: Date,
		limit: number,
		path?: string | null
	): Promise<AppErrorSummary[]> {
		return this.admin.listErrorSummariesByPath(since, limit, path);
	}

	listErrorPathCountsSince(since: Date, limit: number): Promise<AppErrorPathCount[]> {
		return this.admin.listErrorPathCountsSince(since, limit);
	}

	getErrorStack(id: string) {
		return this.admin.getErrorStack(id);
	}

	async setUserRole(actorId: string, targetUserId: string, role: UserRole) {
		if (actorId === targetUserId && role !== 'admin') {
			throw new AdminError('You cannot remove your own admin access');
		}

		await this.admin.setUserRole(targetUserId, role);
	}

	setUserPetsEnabled(userId: string, enabled: boolean) {
		return this.admin.setUserPetsEnabled(userId, enabled);
	}

	async setHouseholdPlan(
		actorId: string,
		householdId: string,
		planTier: PlanTier,
		clearStripe: boolean
	) {
		await this.billing.adminSetHouseholdPlan({ householdId, planTier, clearStripe });
		await this.adminActions.logAction({
			actorUserId: actorId,
			action: 'household_plan',
			targetUserId: null,
			metadata: { householdId, planTier, clearStripe }
		});
	}

	logoutAllUsers() {
		return this.admin.invalidateAllSessions();
	}

	logoutUser(userId: string) {
		return this.admin.invalidateUserSessions(userId);
	}

	async sendPasswordResetEmail(
		actorId: string,
		targetUserId: string,
		options?: { forceReset?: boolean; locale?: 'sv' | 'en' }
	) {
		if (options?.forceReset) {
			await this.admin.invalidateUserSessions(targetUserId);
		}

		const result = await this.passwordReset.adminTriggerReset(targetUserId, options);
		await this.adminActions.logAction({
			actorUserId: actorId,
			action: 'password_reset_email',
			targetUserId,
			metadata: {
				forceReset: Boolean(options?.forceReset),
				sent: result.sent
			}
		});
		return result;
	}
}
