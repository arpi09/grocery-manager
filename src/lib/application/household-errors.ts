import { fail } from '@sveltejs/kit';
import {
	AlreadyMemberError,
	DeleteHouseholdConfirmationError,
	HouseholdForbiddenError,
	HouseholdNotFoundError,
	InviteEmailMismatchError,
	InviteExpiredError,
	InviteNotFoundError,
	InviteNotPendingError,
	LastOwnerError,
	MemberNotFoundError,
	PendingInviteExistsError
} from '$lib/application/household.service';
import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';
import { translate, type MessageKey } from '$lib/i18n/messages';

export type HouseholdFormErrorField = 'householdError' | 'acceptError';

const ERROR_KEYS: Record<string, MessageKey> = {
	HouseholdForbiddenError: 'errors.household.forbidden',
	InviteNotFoundError: 'errors.household.inviteNotFound',
	MemberNotFoundError: 'errors.household.memberNotFound',
	HouseholdNotFoundError: 'errors.household.householdNotFound',
	DeleteHouseholdConfirmationError: 'errors.household.deleteConfirm',
	AlreadyMemberError: 'errors.household.alreadyMember',
	PendingInviteExistsError: 'errors.household.pendingInvite',
	LastOwnerError: 'errors.household.lastOwner',
	InviteNotPendingError: 'errors.household.inviteNotPending',
	InviteExpiredError: 'errors.household.inviteExpired',
	InviteEmailMismatchError: 'errors.household.inviteEmailMismatch'
};

function failWithField(
	status: number,
	field: HouseholdFormErrorField,
	message: string
) {
	if (field === 'acceptError') {
		return fail(status, { acceptError: message });
	}
	return fail(status, { householdError: message });
}

function messageForError(error: unknown, locale: Locale): string | null {
	const key = error instanceof Error ? ERROR_KEYS[error.name] : undefined;
	return key ? translate(locale, key) : null;
}

/** Maps household domain errors to SvelteKit `fail()` for form actions. */
export function mapHouseholdErrorToFail(
	error: unknown,
	field: HouseholdFormErrorField = 'householdError',
	locale: Locale = DEFAULT_LOCALE
) {
	const message = messageForError(error, locale);
	if (message) {
		const status =
			error instanceof HouseholdForbiddenError
				? 403
				: error instanceof InviteNotFoundError ||
					  error instanceof MemberNotFoundError ||
					  error instanceof HouseholdNotFoundError
					? 404
					: 400;
		return failWithField(status, field, message);
	}
	throw error;
}
