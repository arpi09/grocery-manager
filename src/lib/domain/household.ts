import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';
import {
	householdRoleLabelI18n,
	inviteRoleLabelI18n
} from '$lib/i18n/domain-labels';

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

export function householdRoleLabel(
	role: HouseholdRole,
	locale: Locale = DEFAULT_LOCALE
): string {
	return householdRoleLabelI18n(locale, role);
}

export function inviteRoleLabel(role: InviteRole, locale: Locale = DEFAULT_LOCALE): string {
	return inviteRoleLabelI18n(locale, role);
}
