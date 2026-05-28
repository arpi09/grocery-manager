export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserProfile {
	id: string;
	email: string;
	displayName: string | null;
	avatarUrl: string | null;
}

export function isAdminRole(role: string | undefined | null): role is 'admin' {
	return role === 'admin';
}

export function userInitials(
	displayName: string | null | undefined,
	email: string
): string {
	const trimmed = displayName?.trim();
	if (trimmed) {
		const parts = trimmed.split(/\s+/).filter(Boolean);
		if (parts.length >= 2) {
			return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
		}
		return trimmed.slice(0, 2).toUpperCase();
	}

	return email.slice(0, 2).toUpperCase();
}
