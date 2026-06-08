import type { InventoryWriteAction } from '$lib/domain/sync-analytics';

export interface HouseholdActivityEvent {
	id: string;
	householdId: string;
	userId: string | null;
	eventType: string;
	createdAt: Date;
	action: InventoryWriteAction | null;
	itemId: string | null;
}

export function parseInventoryWriteMetadata(
	metadata: string | null
): { action: InventoryWriteAction | null; itemId: string | null } {
	if (!metadata) return { action: null, itemId: null };
	try {
		const parsed = JSON.parse(metadata) as { action?: unknown; itemId?: unknown };
		const action =
			parsed.action === 'create' ||
			parsed.action === 'consume' ||
			parsed.action === 'confirm' ||
			parsed.action === 'merge'
				? parsed.action
				: null;
		const itemId = typeof parsed.itemId === 'string' && parsed.itemId.trim() ? parsed.itemId : null;
		return { action, itemId };
	} catch {
		return { action: null, itemId: null };
	}
}
