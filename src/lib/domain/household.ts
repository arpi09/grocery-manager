export type HouseholdRole = 'owner' | 'member';

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
