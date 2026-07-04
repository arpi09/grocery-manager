import type { InventoryWriteAction } from '$lib/domain/sync-analytics';

export interface HomePulseMember {
	userId: string;
	name: string;
}

export interface HomePulseActivity {
	actorName: string | null;
	eventType: string;
	action: InventoryWriteAction | null;
	itemName: string | null;
	createdAt: Date;
}

export function memberInitial(name: string): string {
	const trimmed = name.trim();
	return trimmed ? trimmed[0]!.toUpperCase() : '?';
}

/** Deterministisk medlemsfärg — zonaccenterna cyklas i stabil ordning. */
export const MEMBER_COLOR_VARS = [
	'--color-fridge',
	'--color-cupboard',
	'--color-freezer'
] as const;

export function memberColorVar(index: number): string {
	return MEMBER_COLOR_VARS[index % MEMBER_COLOR_VARS.length]!;
}
