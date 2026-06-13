import { randomBytes } from 'node:crypto';
import {
	canEditInventory,
	isHouseholdOwner,
	isShareInviteEmail,
	SHARE_INVITE_EMAIL,
	type HouseholdInviteView,
	type HouseholdRole,
	type HouseholdView,
	type InviteRole,
	type UserHouseholdSummary
} from '$lib/domain/household';
import { generateId } from '$lib/infrastructure/auth/id';
import type { IHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';

const INVITE_EXPIRY_DAYS = 7;

export class HouseholdForbiddenError extends Error {
	constructor(message = 'Endast ägare kan utföra denna åtgärd.') {
		super(message);
		this.name = 'HouseholdForbiddenError';
	}
}

export class InviteNotFoundError extends Error {
	constructor() {
		super('Inbjudan hittades inte.');
		this.name = 'InviteNotFoundError';
	}
}

export class InviteExpiredError extends Error {
	constructor() {
		super('Inbjudan har gått ut.');
		this.name = 'InviteExpiredError';
	}
}

export class InviteNotPendingError extends Error {
	constructor() {
		super('Inbjudan är inte längre giltig.');
		this.name = 'InviteNotPendingError';
	}
}

export class InviteEmailMismatchError extends Error {
	constructor() {
		super('Logga in med samma e-postadress som inbjudan skickades till.');
		this.name = 'InviteEmailMismatchError';
	}
}

export class AlreadyMemberError extends Error {
	constructor() {
		super('Användaren är redan medlem i hushållet.');
		this.name = 'AlreadyMemberError';
	}
}

export class MemberNotFoundError extends Error {
	constructor() {
		super('Medlemmen hittades inte.');
		this.name = 'MemberNotFoundError';
	}
}

export class LastOwnerError extends Error {
	constructor() {
		super('Det måste finnas minst en ägare i hushållet.');
		this.name = 'LastOwnerError';
	}
}

export class PendingInviteExistsError extends Error {
	constructor() {
		super('Det finns redan en väntande inbjudan till denna e-postadress.');
		this.name = 'PendingInviteExistsError';
	}
}

export class HouseholdNotFoundError extends Error {
	constructor() {
		super('Pantryn hittades inte.');
		this.name = 'HouseholdNotFoundError';
	}
}

export class NotMemberError extends Error {
	constructor() {
		super('Du är inte medlem i denna pantry.');
		this.name = 'NotMemberError';
	}
}

export class DeleteHouseholdConfirmationError extends Error {
	constructor() {
		super('Bekräftelsen matchar inte. Skriv hushållets namn eller TA BORT.');
		this.name = 'DeleteHouseholdConfirmationError';
	}
}

export interface InvitePreview {
	householdName: string;
	email: string;
	role: InviteRole;
	status: 'pending' | 'accepted' | 'revoked';
	expired: boolean;
}

export interface CreateInviteResult {
	invite: HouseholdInviteView;
	token: string;
}

export class HouseholdService {
	constructor(private readonly repository: IHouseholdRepository) {}

	async getHouseholdForUser(userId: string): Promise<HouseholdView | null> {
		return this.repository.getHouseholdForUser(userId);
	}

	async listHouseholdsForUser(userId: string): Promise<UserHouseholdSummary[]> {
		return this.repository.listHouseholdsForUser(userId);
	}

	async resolveActiveHouseholdId(userId: string): Promise<string> {
		await this.ensureAtLeastOneHousehold(userId);

		const activeId = await this.repository.getActiveHouseholdIdForUser(userId);
		if (activeId && (await this.repository.hasMember(activeId, userId))) {
			return activeId;
		}

		const fallbackId = await this.repository.findPrimaryHouseholdIdForUser(userId);
		if (!fallbackId) {
			return this.ensureHouseholdForUser(userId);
		}

		await this.repository.setActiveHouseholdId(userId, fallbackId);
		return fallbackId;
	}

	async ensureHouseholdForUser(userId: string): Promise<string> {
		return this.resolveActiveHouseholdId(userId);
	}

	async createHousehold(userId: string, name: string): Promise<string> {
		const trimmedName = name.trim();
		if (!trimmedName) {
			throw new Error('Pantryn måste ha ett namn.');
		}

		const householdId = generateId();
		await this.repository.createHousehold(householdId, trimmedName);
		await this.repository.addMember(householdId, userId, 'owner');
		await this.repository.setActiveHouseholdId(userId, householdId);
		return householdId;
	}

	async updateHouseholdName(
		householdId: string,
		actorUserId: string,
		name: string
	): Promise<void> {
		const role = await this.repository.getMemberRole(householdId, actorUserId);
		if (!role || !canEditInventory(role)) {
			throw new HouseholdForbiddenError();
		}

		const trimmedName = name.trim();
		if (!trimmedName) {
			throw new Error('Pantryn måste ha ett namn.');
		}

		const updated = await this.repository.updateHouseholdName(householdId, trimmedName);
		if (!updated) {
			throw new HouseholdNotFoundError();
		}
	}

	async switchActiveHousehold(userId: string, householdId: string): Promise<void> {
		if (!(await this.repository.hasMember(householdId, userId))) {
			throw new NotMemberError();
		}

		await this.repository.setActiveHouseholdId(userId, householdId);
	}

	async deleteHousehold(
		householdId: string,
		actorUserId: string,
		confirmName: string
	): Promise<void> {
		await this.requireOwner(householdId, actorUserId);

		const household = await this.repository.getHouseholdById(householdId);
		if (!household) {
			throw new HouseholdNotFoundError();
		}

		const normalizedConfirm = confirmName.trim();
		if (normalizedConfirm !== household.name && normalizedConfirm !== 'TA BORT') {
			throw new DeleteHouseholdConfirmationError();
		}

		const activeId = await this.repository.getActiveHouseholdIdForUser(actorUserId);
		const wasActive = activeId === householdId;
		let fallbackId: string | null = null;

		if (wasActive) {
			const households = await this.repository.listHouseholdsForUser(actorUserId);
			fallbackId = households.find((row) => row.id !== householdId)?.id ?? null;
		}

		const deleted = await this.repository.deleteHousehold(householdId);
		if (!deleted) {
			throw new HouseholdNotFoundError();
		}

		if (wasActive) {
			await this.repository.setActiveHouseholdId(actorUserId, fallbackId);
		}
	}

	async leaveHousehold(userId: string, householdId: string): Promise<void> {
		const role = await this.repository.getMemberRole(householdId, userId);
		if (!role) {
			throw new NotMemberError();
		}

		if (role === 'owner') {
			const ownerCount = await this.repository.countOwners(householdId);
			if (ownerCount <= 1) {
				throw new LastOwnerError();
			}
		}

		const removed = await this.repository.removeMember(householdId, userId);
		if (!removed) {
			throw new MemberNotFoundError();
		}

		const activeId = await this.repository.getActiveHouseholdIdForUser(userId);
		if (activeId === householdId) {
			const remaining = await this.repository.findPrimaryHouseholdIdForUser(userId);
			await this.repository.setActiveHouseholdId(userId, remaining);
		}
	}

	async getRoleForUser(householdId: string, userId: string): Promise<HouseholdRole | null> {
		return this.repository.getMemberRole(householdId, userId);
	}

	async createInvite(
		householdId: string,
		actorUserId: string,
		email: string,
		role: InviteRole
	): Promise<CreateInviteResult> {
		await this.requireOwner(householdId, actorUserId);

		const normalizedEmail = email.trim().toLowerCase();
		if (await this.repository.isMemberByEmail(householdId, normalizedEmail)) {
			throw new AlreadyMemberError();
		}

		const pending = await this.repository.findPendingInviteByEmail(householdId, normalizedEmail);
		if (pending) {
			throw new PendingInviteExistsError();
		}

		const id = generateId();
		const token = randomBytes(32).toString('base64url');
		const expiresAt = addDays(new Date(), INVITE_EXPIRY_DAYS);

		const created = await this.repository.createInvite({
			id,
			householdId,
			email: normalizedEmail,
			role,
			token,
			invitedByUserId: actorUserId,
			expiresAt
		});

		const invites = await this.repository.listPendingInvites(householdId);
		const invite = invites.find((row) => row.id === created.id);
		if (!invite) {
			throw new Error('Failed to load created invite');
		}

		return { invite, token };
	}

	async createShareInvite(
		householdId: string,
		actorUserId: string,
		role: InviteRole
	): Promise<CreateInviteResult> {
		await this.requireOwner(householdId, actorUserId);

		const pending = await this.repository.findPendingInviteByEmail(householdId, SHARE_INVITE_EMAIL);
		if (pending) {
			const invites = await this.repository.listPendingInvites(householdId);
			const invite = invites.find((row) => row.id === pending.id);
			if (invite) {
				return { invite, token: pending.token };
			}
		}

		const id = generateId();
		const token = randomBytes(32).toString('base64url');
		const expiresAt = addDays(new Date(), INVITE_EXPIRY_DAYS);

		const created = await this.repository.createInvite({
			id,
			householdId,
			email: SHARE_INVITE_EMAIL,
			role,
			token,
			invitedByUserId: actorUserId,
			expiresAt
		});

		const invites = await this.repository.listPendingInvites(householdId);
		const invite = invites.find((row) => row.id === created.id);
		if (!invite) {
			throw new Error('Failed to load created invite');
		}

		return { invite, token };
	}

	async acceptInvite(token: string, userId: string, userEmail: string): Promise<string> {
		const invite = await this.repository.findInviteByToken(token);
		if (!invite) {
			throw new InviteNotFoundError();
		}

		this.assertInviteAcceptable(invite.status, invite.expiresAt);

		const normalizedUserEmail = userEmail.trim().toLowerCase();
		if (
			!isShareInviteEmail(invite.email) &&
			normalizedUserEmail !== invite.email.trim().toLowerCase()
		) {
			throw new InviteEmailMismatchError();
		}

		if (await this.repository.hasMember(invite.householdId, userId)) {
			throw new AlreadyMemberError();
		}

		await this.repository.acceptInvite(invite.id, userId, invite.role);
		return invite.householdId;
	}

	async joinSharedListHousehold(
		targetHouseholdId: string,
		userId: string
	): Promise<'joined' | 'already_member'> {
		if (await this.repository.hasMember(targetHouseholdId, userId)) {
			await this.repository.setActiveHouseholdId(userId, targetHouseholdId);
			return 'already_member';
		}

		await this.repository.addMember(targetHouseholdId, userId, 'editor');
		await this.repository.setActiveHouseholdId(userId, targetHouseholdId);
		return 'joined';
	}

	async updateMemberRole(
		householdId: string,
		actorUserId: string,
		targetUserId: string,
		role: HouseholdRole
	): Promise<void> {
		await this.requireOwner(householdId, actorUserId);

		const currentRole = await this.repository.getMemberRole(householdId, targetUserId);
		if (!currentRole) {
			throw new MemberNotFoundError();
		}

		if (currentRole === 'owner' && role !== 'owner') {
			const ownerCount = await this.repository.countOwners(householdId);
			if (ownerCount <= 1) {
				throw new LastOwnerError();
			}
		}

		const updated = await this.repository.updateMemberRole(householdId, targetUserId, role);
		if (!updated) {
			throw new MemberNotFoundError();
		}
	}

	async removeMember(
		householdId: string,
		actorUserId: string,
		targetUserId: string
	): Promise<void> {
		await this.requireOwner(householdId, actorUserId);

		const currentRole = await this.repository.getMemberRole(householdId, targetUserId);
		if (!currentRole) {
			throw new MemberNotFoundError();
		}

		if (currentRole === 'owner') {
			const ownerCount = await this.repository.countOwners(householdId);
			if (ownerCount <= 1) {
				throw new LastOwnerError();
			}
		}

		const removed = await this.repository.removeMember(householdId, targetUserId);
		if (!removed) {
			throw new MemberNotFoundError();
		}
	}

	async listPendingInvites(
		householdId: string,
		actorUserId: string
	): Promise<HouseholdInviteView[]> {
		await this.requireOwner(householdId, actorUserId);
		return this.repository.listPendingInvites(householdId);
	}

	async revokeInvite(householdId: string, actorUserId: string, inviteId: string): Promise<void> {
		await this.requireOwner(householdId, actorUserId);

		const revoked = await this.repository.revokePendingInvite(householdId, inviteId);
		if (!revoked) {
			throw new InviteNotFoundError();
		}
	}

	async getInvitePreview(token: string): Promise<InvitePreview> {
		const preview = await this.repository.getInvitePreview(token);
		if (!preview) {
			throw new InviteNotFoundError();
		}

		return {
			householdName: preview.householdName,
			email: preview.email,
			role: preview.role,
			status: preview.status,
			expired: preview.status === 'pending' && preview.expiresAt.getTime() < Date.now()
		};
	}

	private async ensureAtLeastOneHousehold(userId: string) {
		const existing = await this.repository.findPrimaryHouseholdIdForUser(userId);
		if (existing) {
			return;
		}

		const householdId = generateId();
		await this.repository.createHousehold(householdId, 'Mitt hushåll');
		await this.repository.addMember(householdId, userId, 'owner');
		await this.repository.setActiveHouseholdId(userId, householdId);
	}

	private async requireOwner(householdId: string, userId: string) {
		const role = await this.repository.getMemberRole(householdId, userId);
		if (!role || !isHouseholdOwner(role)) {
			throw new HouseholdForbiddenError();
		}
	}

	findPrimaryOwnerUserId(householdId: string): Promise<string | null> {
		return this.repository.findPrimaryOwnerUserId(householdId);
	}

	private assertInviteAcceptable(status: string, expiresAt: Date) {
		if (status !== 'pending') {
			throw new InviteNotPendingError();
		}
		if (expiresAt.getTime() < Date.now()) {
			throw new InviteExpiredError();
		}
	}
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}
