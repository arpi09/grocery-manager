export type AdminTab = 'overview' | 'analytics' | 'users' | 'logs' | 'feedback';

export const ADMIN_TABS: AdminTab[] = ['overview', 'analytics', 'users', 'logs', 'feedback'];

export function parseAdminTab(raw: string | null): AdminTab {
	if (raw && ADMIN_TABS.includes(raw as AdminTab)) {
		return raw as AdminTab;
	}
	return 'overview';
}

export async function fetchAdminData<T>(
	section: string,
	params: Record<string, string | number> = {}
): Promise<T> {
	const search = new URLSearchParams({ section });
	for (const [key, value] of Object.entries(params)) {
		search.set(key, String(value));
	}

	const response = await fetch(`/api/admin/data?${search}`);
	if (!response.ok) {
		throw new Error(`Admin data request failed (${response.status})`);
	}

	return (await response.json()) as T;
}

export function parseIsoDate(value: string): Date {
	return new Date(value);
}
