import type { MessageKey } from '$lib/i18n/messages';

import { preferredScanHref } from '$lib/utils/scan-nav';

import { HEM_PATH, INKOP_PATH } from './app-home';

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
	| 'more'
	| 'scan'
	| 'sparkle'
	| 'mapPin';

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
	| 'nav.grannskafferiet'
	| 'nav.pets'
	| 'nav.admin'
	| 'nav.more'
	| 'nav.eat'
	| 'nav.scan'
>;

export type NavDynamicHref = 'scan';

export type NavBadge = 'stale';

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

	/** Cart-style link in header (not bottom tab) */

	headerUtility?: boolean;

	/** Resolve href at runtime (e.g. scan hub with return path) */

	dynamicHref?: NavDynamicHref;

	/** Badge variant on this nav item */

	badge?: NavBadge;

	/** Only when `user.role` matches */

	roles?: NavRole[];

	/** Only when pets are enabled for the household */

	requiresPets?: boolean;

	match?: NavMatch;
}

/** Single source of truth for app navigation (account routes live in ProfileMenu only) */

export const NAV_ITEMS: NavItem[] = [
	{ href: HEM_PATH, labelKey: 'nav.home', icon: 'home', primary: true, match: 'exact' },

	{
		href: '/inventory/fridge',

		labelKey: 'nav.inventory',

		icon: 'inventory',

		primary: true,

		badge: 'stale',

		match: 'prefix'
	},

	{
		href: INKOP_PATH,

		labelKey: 'nav.shopping',

		icon: 'shopping',

		primary: true,

		match: 'prefix'
	},

	{
		href: '/scan',

		labelKey: 'nav.scan',

		icon: 'scan',

		headerUtility: true,
		dynamicHref: 'scan',

		match: 'prefix'
	},

	{ href: '/planer', labelKey: 'nav.eat', icon: 'sparkle', match: 'prefix' },

	{ href: '/statistik', labelKey: 'nav.stats', icon: 'chart', match: 'prefix' },

	{ href: '/nyheter', labelKey: 'nav.news', icon: 'news', match: 'prefix' },

	{
		href: '/grannskafferiet',

		labelKey: 'nav.grannskafferiet',

		icon: 'mapPin',

		match: 'prefix'
	},

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

export function resolveNavHref(item: NavItem, pathname: string): string {
	if (item.dynamicHref === 'scan' && pathname) {
		return preferredScanHref();
	}

	return item.href;
}

export function navItemTestId(item: NavItem): string | undefined {
	if (item.dynamicHref === 'scan') {
		return 'nav-scan';
	}

	if (item.badge === 'stale') {
		return 'nav-pantry';
	}

	if (item.href === HEM_PATH && item.labelKey === 'nav.home') {
		return 'nav-home';
	}

	if (item.href === INKOP_PATH && item.labelKey === 'nav.shopping') {
		return 'nav-shopping';
	}

	if (item.href === '/planer' && item.labelKey === 'nav.eat') {
		return 'nav-eat';
	}

	return undefined;
}

export function isNavActive(pathname: string, item: NavItem): boolean {
	if (item.dynamicHref === 'scan') {
		return pathname === '/scan' || pathname.startsWith('/scan/');
	}

	if (item.match === 'prefix') {
		return pathname === item.href || pathname.startsWith(`${item.href}/`);
	}

	if (item.href === HEM_PATH) {
		return pathname === HEM_PATH;
	}

	return pathname === item.href;
}

export function splitNavItems(items: NavItem[]) {
	const primary = items.filter((item) => item.primary);

	const headerUtility = items.filter((item) => item.headerUtility);

	const secondary = items.filter((item) => !item.primary && !item.headerUtility);

	return { primary, headerUtility, secondary };
}
