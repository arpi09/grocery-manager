import { error, fail, redirect } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { householdSuggestionsService } from '$lib/server/di';
import { appendActionToast } from '$lib/utils/action-toast';
import {
	resetLocationSuggestionSchema,
	resetShelfLifeSuggestionSchema
} from '$lib/validation/household-suggestions.schemas';
import type { RequestEvent } from '@sveltejs/kit';

function requireHouseholdEditor(locals: App.Locals) {
	const householdId = locals.householdId;
	const role = locals.householdRole;
	if (!householdId || !role || !canEditInventory(role)) {
		throw error(403, 'Forbidden');
	}
	return householdId;
}

export const memoryActions = {
	resetShelfLifeSuggestion: async ({ request, locals }: RequestEvent) => {
		const householdId = requireHouseholdEditor(locals);
		const formData = await request.formData();
		const parsed = resetShelfLifeSuggestionSchema.safeParse({
			normalizedKey: formData.get('normalizedKey'),
			location: formData.get('location')
		});

		if (!parsed.success) {
			return fail(400, { memoryErrors: parsed.error.flatten().fieldErrors });
		}

		await householdSuggestionsService.resetShelfLifeRule(
			householdId,
			parsed.data.normalizedKey,
			parsed.data.location
		);
		redirect(302, appendActionToast('/settings/memory', 'suggestionReset'));
	},
	resetLocationSuggestion: async ({ request, locals }: RequestEvent) => {
		const householdId = requireHouseholdEditor(locals);
		const formData = await request.formData();
		const parsed = resetLocationSuggestionSchema.safeParse({
			normalizedKey: formData.get('normalizedKey')
		});

		if (!parsed.success) {
			return fail(400, { memoryErrors: parsed.error.flatten().fieldErrors });
		}

		await householdSuggestionsService.resetLocationRule(householdId, parsed.data.normalizedKey);
		redirect(302, appendActionToast('/settings/memory', 'suggestionReset'));
	}
};
