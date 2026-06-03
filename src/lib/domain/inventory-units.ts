/** Common grocery quantity units (Swedish retail conventions). */
export const INVENTORY_UNITS = ['st', 'g', 'kg', 'l', 'ml', 'cl', 'dl', 'förp', 'pack'] as const;

export type InventoryUnit = (typeof INVENTORY_UNITS)[number];

const DEFAULT_UNIT: InventoryUnit = 'st';

const LIQUID_PATTERN =
	/\b(mjölk|mjolk|milk|filmjölk|filmjolk|yoghurt|yogurt|fil\b|gräddfil|graddfil|juice|läsk|lask|öl|ol\b|vatten|saft|dricka)\b/i;
const WEIGHT_PATTERN =
	/\b(smör|smor|butter|ost\b|färs|fars|korv|bacon|skinka|chark|pasta|ris\b|rice|socker|flour|mjöl|mjol)\b/i;
const PACK_PATTERN = /\b(pack|förp|forp|multipack|x\s*\d+)\b/i;

/** Suggest a default unit from product name (and optional vision hint). */
export function suggestUnitForName(name: string, hint?: string | null): InventoryUnit {
	const normalizedHint = hint?.trim().toLowerCase();
	if (normalizedHint && isKnownUnit(normalizedHint)) {
		return normalizedHint as InventoryUnit;
	}

	const normalized = name.trim().toLowerCase();
	if (PACK_PATTERN.test(normalized)) return 'förp';
	if (LIQUID_PATTERN.test(normalized)) return 'l';
	if (WEIGHT_PATTERN.test(normalized)) return 'g';
	if (/\b(ägg|agg|egg)\b/.test(normalized)) return 'st';
	if (/\b(banan|äpple|applen|citron|lime)\b/.test(normalized)) return 'kg';

	return DEFAULT_UNIT;
}

export function isKnownUnit(value: string): value is InventoryUnit {
	return (INVENTORY_UNITS as readonly string[]).includes(value.trim().toLowerCase());
}

export function normalizeUnitInput(value: string | null | undefined): string {
	const trimmed = value?.trim() ?? '';
	if (!trimmed) return '';
	if (isKnownUnit(trimmed)) return trimmed.toLowerCase() === 'förp' ? 'förp' : trimmed.toLowerCase();
	return trimmed.slice(0, 20);
}
