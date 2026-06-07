export type AdminTab =
	| 'overview'
	| 'analytics'
	| 'decisions'
	| 'aiUsage'
	| 'users'
	| 'logs'
	| 'feedback'
	| 'pmfSurvey';

export const ADMIN_TABS: AdminTab[] = [
	'overview',
	'analytics',
	'decisions',
	'aiUsage',
	'users',
	'logs',
	'feedback',
	'pmfSurvey'
];

const ADMIN_TAB_ALIASES: Record<string, AdminTab> = {
	behavior: 'decisions'
};

export function parseAdminTab(raw: string | null): AdminTab {
	if (raw && ADMIN_TABS.includes(raw as AdminTab)) {
		return raw as AdminTab;
	}
	if (raw && raw in ADMIN_TAB_ALIASES) {
		return ADMIN_TAB_ALIASES[raw];
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
