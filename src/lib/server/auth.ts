import { isAdminRole } from '$lib/domain/user';
import type { User } from 'lucia';

export function isAdmin(user: User | null | undefined): boolean {
	return isAdminRole(user?.role);
}
