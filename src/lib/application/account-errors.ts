import { fail } from '@sveltejs/kit';
import {
	AccountNotFoundError
} from '$lib/application/account.service';
import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';
import { translate, type MessageKey } from '$lib/i18n/messages';

const ERROR_KEYS: Record<string, MessageKey> = {
	DeleteAccountConfirmationError: 'errors.account.deleteConfirm',
	AccountNotFoundError: 'errors.account.notFound'
};

export function mapAccountErrorToFail(error: unknown, locale: Locale = DEFAULT_LOCALE) {
	const key = error instanceof Error ? ERROR_KEYS[error.name] : undefined;
	if (key) {
		const status = error instanceof AccountNotFoundError ? 404 : 400;
		return fail(status, { accountError: translate(locale, key) });
	}

	throw error;
}
