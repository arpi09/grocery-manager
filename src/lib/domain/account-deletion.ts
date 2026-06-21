/** Typed confirmation words accepted for self-service account deletion. */
export const ACCOUNT_DELETE_CONFIRM_WORDS = ['RADERA', 'DELETE', 'TA BORT'] as const;

export function isAccountDeleteConfirmationValid(input: string): boolean {
	const normalized = input.trim();
	return ACCOUNT_DELETE_CONFIRM_WORDS.some((word) => word === normalized);
}
