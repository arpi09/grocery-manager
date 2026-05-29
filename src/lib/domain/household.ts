export type HouseholdRole = 'owner' | 'editor' | 'viewer';

export type InviteRole = 'editor' | 'viewer';

export type InviteStatus = 'pending' | 'accepted' | 'revoked';

export interface HouseholdMemberView {
	userId: string;
	email: string;
	displayName: string | null;
	role: HouseholdRole;
}

export interface HouseholdView {
	id: string;
	name: string;
	members: HouseholdMemberView[];
}

export interface UserHouseholdSummary {
	id: string;
	name: string;
	role: HouseholdRole;
	isActive: boolean;
}

export interface HouseholdInviteView {
	id: string;
	email: string;
	role: InviteRole;
	status: InviteStatus;
	expiresAt: Date;
	createdAt: Date;
	invitedByEmail: string;
}

export function canEditInventory(role: HouseholdRole): boolean {
	return role === 'owner' || role === 'editor';
}

export function isHouseholdOwner(role: HouseholdRole): boolean {
	return role === 'owner';
}

export function householdRoleLabel(role: HouseholdRole): string {
	switch (role) {
		case 'owner':
			return 'Ägare';
		case 'editor':
			return 'Redigera';
		case 'viewer':
			return 'Visa';
	}
}

export function inviteRoleLabel(role: InviteRole): string {
	switch (role) {
		case 'editor':
			return 'Redigera';
		case 'viewer':
			return 'Visa';
	}
}
