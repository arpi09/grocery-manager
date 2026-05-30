import type { HouseholdRole, InviteRole } from '$lib/domain/household';
import type { StorageLocation } from '$lib/domain/location';
import type { ThemePreference } from '$lib/domain/theme';
import type { Locale } from './locale';
import { translate, type MessageKey } from './messages';

const LOCATION_KEYS: Record<StorageLocation, MessageKey> = {
	fridge: 'location.fridge',
	freezer: 'location.freezer',
	cupboard: 'location.cupboard'
};

const THEME_KEYS: Record<ThemePreference, MessageKey> = {
	light: 'profile.themeLight',
	dark: 'profile.themeDark',
	system: 'profile.themeSystem'
};

const HOUSEHOLD_ROLE_KEYS: Record<HouseholdRole, MessageKey> = {
	owner: 'household.roleOwner',
	editor: 'household.roleEditor',
	viewer: 'household.roleViewer'
};

const INVITE_ROLE_KEYS: Record<InviteRole, MessageKey> = {
	editor: 'household.roleEditor',
	viewer: 'household.roleViewer'
};

export function locationLabel(locale: Locale, location: StorageLocation): string {
	return translate(locale, LOCATION_KEYS[location]);
}

export function themeLabel(locale: Locale, preference: ThemePreference): string {
	return translate(locale, THEME_KEYS[preference]);
}

export function householdRoleLabelI18n(locale: Locale, role: HouseholdRole): string {
	return translate(locale, HOUSEHOLD_ROLE_KEYS[role]);
}

export function inviteRoleLabelI18n(locale: Locale, role: InviteRole): string {
	return translate(locale, INVITE_ROLE_KEYS[role]);
}
