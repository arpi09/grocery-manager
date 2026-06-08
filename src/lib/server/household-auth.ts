import { error } from '@sveltejs/kit';
import {
	canConsumeInventory,
	canEditInventory,
	type HouseholdRole
} from '$lib/domain/household';

export function requireInventoryWriteAccess(role: HouseholdRole | null): void {
	if (!role || !canEditInventory(role)) {
		error(403, 'Du har endast läsbehörighet i detta hushåll.');
	}
}

export function requireInventoryConsumeAccess(role: HouseholdRole | null): void {
	if (!role || !canConsumeInventory(role)) {
		error(403, 'Du har inte behörighet att konsumera varor i detta hushåll.');
	}
}
