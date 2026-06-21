import { isHouseholdOwner, type HouseholdMemberView } from '$lib/domain/household';
import { isAccountDeleteConfirmationValid } from '$lib/domain/account-deletion';
import type { IHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';

export class DeleteAccountConfirmationError extends Error {
	constructor() {
		super('Account deletion confirmation did not match');
		this.name = 'DeleteAccountConfirmationError';
	}
}

export class AccountNotFoundError extends Error {
	constructor() {
		super('User not found');
		this.name = 'AccountNotFoundError';
	}
}

export interface AccountDeletionImpact {
	sharedHouseholdCount: number;
	soleMemberHouseholdCount: number;
}

export interface IAccountSessionRepository {
	invalidateUserSessions(userId: string): Promise<number>;
}

function pickOwnerSuccessor(members: HouseholdMemberView[]): HouseholdMemberView {
	const editors = members.filter((member) => member.role === 'editor');
	if (editors.length > 0) {
		return editors[0];
	}

	const viewers = members.filter((member) => member.role === 'viewer');
	if (viewers.length > 0) {
		return viewers[0];
	}

	return members[0];
}

export class AccountService {
	constructor(
		private readonly users: IUserRepository,
		private readonly households: IHouseholdRepository,
		private readonly sessions: IAccountSessionRepository
	) {}

	async getDeletionImpact(userId: string): Promise<AccountDeletionImpact> {
		const summaries = await this.households.listHouseholdsForUser(userId);
		let sharedHouseholdCount = 0;
		let soleMemberHouseholdCount = 0;

		for (const summary of summaries) {
			const household = await this.households.getHouseholdById(summary.id);
			if (!household) {
				continue;
			}

			const otherMembers = household.members.filter((member) => member.userId !== userId);
			if (otherMembers.length === 0) {
				soleMemberHouseholdCount += 1;
			} else {
				sharedHouseholdCount += 1;
			}
		}

		return { sharedHouseholdCount, soleMemberHouseholdCount };
	}

	async deleteAccount(userId: string, confirmText: string): Promise<void> {
		if (!isAccountDeleteConfirmationValid(confirmText)) {
			throw new DeleteAccountConfirmationError();
		}

		const user = await this.users.findById(userId);
		if (!user) {
			throw new AccountNotFoundError();
		}

		const summaries = await this.households.listHouseholdsForUser(userId);

		for (const summary of summaries) {
			const household = await this.households.getHouseholdById(summary.id);
			if (!household) {
				continue;
			}

			const otherMembers = household.members.filter((member) => member.userId !== userId);

			if (otherMembers.length === 0) {
				await this.households.deleteHousehold(summary.id);
				continue;
			}

			if (isHouseholdOwner(summary.role)) {
				const ownerCount = household.members.filter((member) => member.role === 'owner').length;
				if (ownerCount <= 1) {
					const successor = pickOwnerSuccessor(otherMembers);
					await this.households.updateMemberRole(summary.id, successor.userId, 'owner');
				}
			}

			await this.households.removeMember(summary.id, userId);
		}

		await this.sessions.invalidateUserSessions(userId);
		await this.users.deleteUser(userId);
	}
}
