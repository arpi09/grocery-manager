import { z } from 'zod';
import { isAccountDeleteConfirmationValid } from '$lib/domain/account-deletion';

export const deleteAccountSchema = z.object({
	confirmText: z
		.string()
		.trim()
		.min(1, 'Skriv RADERA för att bekräfta')
		.refine(isAccountDeleteConfirmationValid, {
			message: 'Skriv RADERA för att bekräfta'
		})
});
