import type { AppErrorSummary } from '$lib/domain/error-log';
import type { UserRole } from '$lib/domain/user';
import type {
	AdminDashboardStats,
	IAdminRepository
} from '$lib/infrastructure/repositories/admin.repository';

export class AdminError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AdminError';
	}
}

export class AdminService {
	constructor(private readonly admin: IAdminRepository) {}

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

	logoutAllUsers() {
		return this.admin.invalidateAllSessions();
	}

	logoutUser(userId: string) {
		return this.admin.invalidateUserSessions(userId);
	}
}
