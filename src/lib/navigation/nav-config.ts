export type NavIconId =
	| 'home'
	| 'inventory'
	| 'shopping'
	| 'calendar'
	| 'chart'
	| 'settings'
	| 'paw'
	| 'shield'
	| 'more';

export type NavRole = 'admin';

export type NavMatch = 'exact' | 'prefix';

export interface NavUser {
	email?: string;
	role?: string;
	petsEnabled?: boolean;
}

export interface NavItem {
	href: string;
	label: string;
	icon: NavIconId;
	/** Shown in mobile tab bar and desktop primary row */
	primary?: boolean;
	/** Only when `user.role` matches */
	roles?: NavRole[];
	/** Only when pets are enabled for the household */
	requiresPets?: boolean;
	match?: NavMatch;
}

/** Single source of truth for app navigation */
export const NAV_ITEMS: NavItem[] = [
	{ href: '/', label: 'Hem', icon: 'home', primary: true, match: 'exact' },
	{
		href: '/inventory/fridge',
		label: 'Skafferi',
		icon: 'inventory',
		primary: true,
		match: 'prefix'
	},
	{ href: '/inkop', label: 'Inköp', icon: 'shopping', primary: true, match: 'prefix' },
	{ href: '/planer', label: 'Planer', icon: 'calendar', match: 'prefix' },
	{ href: '/statistik', label: 'Statistik', icon: 'chart', match: 'prefix' },
	{ href: '/settings', label: 'Inställningar', icon: 'settings', match: 'prefix' },
	{ href: '/husdjur', label: 'Husdjur', icon: 'paw', requiresPets: true, match: 'prefix' },
	{ href: '/admin', label: 'Admin', icon: 'shield', roles: ['admin'], match: 'prefix' }
];

export function isNavItemVisible(item: NavItem, user: NavUser | null | undefined): boolean {
	if (item.roles?.length) {
		if (!user?.role || !item.roles.includes(user.role as NavRole)) {
			return false;
		}
	}
	if (item.requiresPets && !user?.petsEnabled) {
		return false;
	}
	return true;
}

export function filterNavItems(items: NavItem[], user: NavUser | null | undefined): NavItem[] {
	return items.filter((item) => isNavItemVisible(item, user));
}

export function isNavActive(pathname: string, item: NavItem): boolean {
	if (item.match === 'prefix') {
		return pathname === item.href || pathname.startsWith(`${item.href}/`);
	}
	if (item.href === '/') {
		return pathname === '/';
	}
	return pathname === item.href;
}

export function splitNavItems(items: NavItem[]) {
	const primary = items.filter((item) => item.primary);
	const secondary = items.filter((item) => !item.primary);
	return { primary, secondary };
}
