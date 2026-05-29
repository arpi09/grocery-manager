import { error } from '@sveltejs/kit';
import { canEditInventory, type HouseholdRole } from '$lib/domain/household';

export function requireInventoryWriteAccess(role: HouseholdRole | null): void {
	if (!role || !canEditInventory(role)) {
		error(403, 'Du har endast läsbehörighet i detta hushåll.');
	}
}
