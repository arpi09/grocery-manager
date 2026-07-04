import { isStorageLocation, type StorageLocation } from './location';

/** One row in the trip-complete "Packa upp" batch. `shoppingItemId` is null for extras added in the sheet. */
export interface UnpackRowInput {
	shoppingItemId: string | null;
	name: string;
	location: StorageLocation;
	quantity: string;
	unit: string | null;
}

export const MAX_UNPACK_ROWS = 100;

export function parseUnpackRows(raw: unknown): UnpackRowInput[] | null {
	if (typeof raw !== 'string' || !raw) {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}

	if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_UNPACK_ROWS) {
		return null;
	}

	const rows: UnpackRowInput[] = [];
	for (const entry of parsed) {
		if (!entry || typeof entry !== 'object') {
			return null;
		}
		const { shoppingItemId, name, location, quantity, unit } = entry as Record<string, unknown>;
		if (typeof name !== 'string' || !name.trim()) {
			return null;
		}
		if (typeof location !== 'string' || !isStorageLocation(location)) {
			return null;
		}
		rows.push({
			shoppingItemId:
				typeof shoppingItemId === 'string' && shoppingItemId ? shoppingItemId : null,
			name: name.trim().slice(0, 120),
			location,
			quantity:
				typeof quantity === 'string' && quantity.trim() ? quantity.trim().slice(0, 20) : '1',
			unit: typeof unit === 'string' && unit.trim() ? unit.trim().slice(0, 20) : null
		});
	}
	return rows;
}
