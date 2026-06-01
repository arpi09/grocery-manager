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

function suffix(): string {
	return ` · ${SITE_NAME}`;
}

/** Human-readable document title for authenticated app routes. */
export function resolveAppPageTitle(pathname: string, locale: Locale): string {
	if (pathname === APP_HOME_PATH) {
		return translate(locale, 'dashboard.title') + suffix();
	}
	if (pathname.startsWith('/inventory/')) {
		const segment = pathname.split('/')[2];
		if (segment && isStorageLocation(segment)) {
			const label = LOCATION_LABELS[segment]?.[locale] ?? segment;
			return `${label}${suffix()}`;
		}
		return translate(locale, 'inventory.title') + suffix();
	}
	if (pathname.startsWith('/inkop')) {
		return translate(locale, 'shopping.title') + suffix();
	}
	if (pathname.startsWith('/planer')) {
		return translate(locale, 'planer.title') + suffix();
	}
	if (pathname.startsWith('/statistik')) {
		return translate(locale, 'stats.title') + suffix();
	}
	if (pathname.startsWith('/settings')) {
		return translate(locale, 'settings.title') + suffix();
	}
	if (pathname.startsWith('/profile')) {
		return translate(locale, 'profile.title') + suffix();
	}
	if (pathname.startsWith('/husdjur')) {
		return translate(locale, 'pets.title') + suffix();
	}
	if (pathname.startsWith('/admin')) {
		return translate(locale, 'admin.title') + suffix();
	}
	if (pathname.startsWith('/scan')) {
		return translate(locale, 'scan.title') + suffix();
	}
	if (pathname.startsWith('/item/new')) {
		return translate(locale, 'item.addTitle') + suffix();
	}
	if (pathname.match(/^\/item\/[^/]+\/edit/)) {
		return translate(locale, 'item.editTitle') + suffix();
	}
	if (pathname.startsWith('/install-app')) {
		return translate(locale, 'pwa.page.title') + suffix();
	}
	if (pathname.startsWith('/invite/')) {
		return translate(locale, 'invite.title') + suffix();
	}

	return SITE_NAME;
}

