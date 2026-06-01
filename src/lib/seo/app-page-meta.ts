import { translate } from '$lib/i18n/messages';
import type { Locale } from '$lib/i18n/locale';
import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { isStorageLocation } from '$lib/domain/location';
import { SITE_NAME } from './seo';

const LOCATION_LABELS: Record<string, Record<Locale, string>> = {
	fridge: { sv: 'Kyl', en: 'Fridge' },
	freezer: { sv: 'Frys', en: 'Freezer' },
	pantry: { sv: 'Skafferi', en: 'Pantry' },
	other: { sv: 'Övrigt', en: 'Other' }
};

function suffix(locale: Locale): string {
	return ` · ${SITE_NAME}`;
}

/** Human-readable document title for authenticated app routes. */
export function resolveAppPageTitle(pathname: string, locale: Locale): string {
	if (pathname === APP_HOME_PATH) {
		return translate(locale, 'dashboard.title') + suffix(locale);
	}
	if (pathname.startsWith('/inventory/')) {
		const segment = pathname.split('/')[2];
		if (segment && isStorageLocation(segment)) {
			const label = LOCATION_LABELS[segment]?.[locale] ?? segment;
			return `${label}${suffix(locale)}`;
		}
		return translate(locale, 'inventory.title') + suffix(locale);
	}
	if (pathname.startsWith('/inkop')) {
		return translate(locale, 'shopping.title') + suffix(locale);
	}
	if (pathname.startsWith('/planer')) {
		return translate(locale, 'planer.title') + suffix(locale);
	}
	if (pathname.startsWith('/statistik')) {
		return translate(locale, 'stats.title') + suffix(locale);
	}
	if (pathname.startsWith('/settings')) {
		return translate(locale, 'settings.title') + suffix(locale);
	}
	if (pathname.startsWith('/profile')) {
		return translate(locale, 'profile.title') + suffix(locale);
	}
	if (pathname.startsWith('/husdjur')) {
		return translate(locale, 'pets.title') + suffix(locale);
	}
	if (pathname.startsWith('/admin')) {
		return translate(locale, 'admin.title') + suffix(locale);
	}
	if (pathname.startsWith('/scan')) {
		return translate(locale, 'scan.title') + suffix(locale);
	}
	if (pathname.startsWith('/item/new')) {
		return translate(locale, 'item.addTitle') + suffix(locale);
	}
	if (pathname.match(/^\/item\/[^/]+\/edit/)) {
		return translate(locale, 'item.editTitle') + suffix(locale);
	}
	if (pathname.startsWith('/install-app')) {
		return translate(locale, 'pwa.page.title') + suffix(locale);
	}
	if (pathname.startsWith('/invite/')) {
		return translate(locale, 'invite.title') + suffix(locale);
	}

	return SITE_NAME;
}
