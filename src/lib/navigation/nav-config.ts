import type { MessageKey } from '$lib/i18n/messages';
import { APP_HOME_PATH } from './app-home';

export type NavIconId =
	| 'home'
	| 'inventory'
	| 'shopping'
	| 'calendar'
	| 'chart'
	| 'news'
	| 'settings'
	| 'paw'
	| 'shield'
	| 'more';

export type NavRole = 'admin';

export type NavMatch = 'exact' | 'prefix';

export type NavLabelKey = Extract<
	MessageKey,
	| 'nav.home'
	| 'nav.inventory'
	| 'nav.shopping'
	| 'nav.plans'
	| 'nav.stats'
	| 'nav.news'
	| 'nav.pets'
	| 'nav.admin'
	| 'nav.more'
>;

export interface NavUser {
	email?: string;
	displayName?: string | null;
	avatarUrl?: string | null;
	role?: string;
	petsEnabled?: boolean;
}

export interface NavItem {
	href: string;
	labelKey: NavLabelKey;
	icon: NavIconId;
	/** Shown in mobile tab bar and desktop primary row */
	primary?: boolean;
	/** Only when `user.role` matches */
	roles?: NavRole[];
	/** Only when pets are enabled for the household */
	requiresPets?: boolean;
	match?: NavMatch;
}

/** Single source of truth for app navigation (account routes live in ProfileMenu only) */
export const NAV_ITEMS: NavItem[] = [
	{ href: APP_HOME_PATH, labelKey: 'nav.home', icon: 'home', primary: true, match: 'exact' },
	{
		href: '/inventory/fridge',
		labelKey: 'nav.inventory',
		icon: 'inventory',
		primary: true,
		match: 'prefix'
	},
	{ href: '/inkop', labelKey: 'nav.shopping', icon: 'shopping', primary: true, match: 'prefix' },
	{ href: '/planer', labelKey: 'nav.plans', icon: 'calendar', match: 'prefix' },
	{ href: '/statistik', labelKey: 'nav.stats', icon: 'chart', match: 'prefix' },
	{ href: '/nyheter', labelKey: 'nav.news', icon: 'news', match: 'prefix' },
	{ href: '/husdjur', labelKey: 'nav.pets', icon: 'paw', requiresPets: true, match: 'prefix' },
	{ href: '/admin', labelKey: 'nav.admin', icon: 'shield', roles: ['admin'], match: 'prefix' }
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
	if (item.href === APP_HOME_PATH) {
		return pathname === APP_HOME_PATH;
	}
	return pathname === item.href;
}

export function splitNavItems(items: NavItem[]) {
	const primary = items.filter((item) => item.primary);
	const secondary = items.filter((item) => !item.primary);
	return { primary, secondary };
}
