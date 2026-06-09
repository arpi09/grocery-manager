import type { Cookies } from '@sveltejs/kit';

export const EXPIRY_REMINDER_CHECKED_COOKIE = 'hp_expiry_reminder_checked';

export function hasExpiryReminderChecked(cookies: Cookies): boolean {
	return cookies.get(EXPIRY_REMINDER_CHECKED_COOKIE) === '1';
}

export function markExpiryReminderChecked(cookies: Cookies): void {
	cookies.set(EXPIRY_REMINDER_CHECKED_COOKIE, '1', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax'
	});
}
